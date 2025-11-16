//send graph ql queries and mutations

const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');

const {sendRequest} = require('../core/http');
const {getEnv, interpolateRequest} = require('../core/env');
const {recordHistory} = require('../core/history');
const {printSuccess, printError, printDebug} = require('../core/printer');

function register(program) {
  program
    .command('gql')
    .description('Send GraphQL queries and mutations')
    .requiredOption('--endpoint <url>', 'GraphQL endpoint URL')
    .option('--query <query>', 'Inline GraphQL query')
    .option('--file <path>', 'Path to .gql or .graphql file')
    .option('--variables <json>', 'Variables as JSON string')
    .option('--env <env>', 'Environment name for variable interpolation')
    .option('-H, --header <header>', 'Request header (repeatable)', collect, [])
    .action(async (options) => {

      //check for either --query or --file
      if (!options.query && !options.file) {
        console.log(chalk.red('Error: Either --query or --file must be provided'));
        process.exit(1);
      }

      if (options.query && options.file) {
        console.log(chalk.yellow('Warning: Both --query and --file provided. Using --file.'));
      }

      //load query
      let query;
      if (options.file) {
        try {
          const filePath = path.resolve(process.cwd(), options.file);
          query = fs.readFileSync(filePath, 'utf-8');

        } catch (error) {
          console.log(chalk.red(`Error reading file: ${error.message}`));
          process.exit(1);

        }

      } else {
        query = options.query;
      }


      //parse vars
      let variables = {};
      if (options.variables) {
        try {
          variables = JSON.parse(options.variables);

        } catch (error) {
          console.log(chalk.red('Error: Invalid JSON in --variables'));
          console.log(chalk.gray(error.message));
          process.exit(1);

        }
      }


      //parse headers
      const headers = {'Content-Type' : 'application/json'};
      options.header.forEach(h => {
        const [key, ...valueParts] = h.split(':');
        const value = valueParts.join(':').trim();
        headers[key.trim()] = value;
      });


      //GQL request
      let requestConfig = {
        method: 'POST',
        url: options.endpoint,
        headers: headers,
        data: JSON.stringify({
          query: query,
          variables: variables
        })
      };

      printDebug('Request before interpolation', requestConfig);

      //if --env, interp
      if (options.env) {
        const env = getEnv(options.env);
        printDebug('Environment loaded', env);
        requestConfig = interpolateRequest(requestConfig, env);
        printDebug('Request after interpolation', requestConfig);
      }

      //send request
      const spinner = ora(`Sending GraphQL query to ${requestConfig.url}`).start();

      try {
        const response = await sendRequest(requestConfig);
        spinner.stop();

        //check for gql errors
        if (response.data && response.data.errors) {
          console.log(chalk.red('GraphQL Errors:'));

          response.data.errors.forEach((err, index) => {
            console.log(chalk.red(`  ${index + 1}. ${err.message || JSON.stringify(err)}`));
          });
        }

        printSuccess(response, 'POST', requestConfig.url);

        recordHistory({
          method: 'POST',
          url: requestConfig.url,
          status: response.status,
          durationMs: response.durationMs,
          env: options.env || null
        });
        

      } catch (error) {
        spinner.stop();
        printError(error, 'POST', requestConfig.url);
        process.exit(2);

      }

    });
}


function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;
