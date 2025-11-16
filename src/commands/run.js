//run command
//runs saved requests
//can override and env interp

const ora = require('ora');
const chalk = require('chalk');

const {getRequestByName} = require('../core/storage');
const {sendRequest} = require('../core/http');
const {getEnv, interpolateRequest} = require('../core/env');
const {recordHistory} = require('../core/history');
const {printSuccess, printError, printDebug} = require('../core/printer');



function register(program) {
  program
    .command('run <name>')
    .description('Execute a saved request')
    .option('--env <env>', 'Environment name for variable interpolation')
    .option('-H, --header <header>', 'Override request header (repeatable)', collect, [])
    .option('-d, --data <data>', 'Override request body')
    .action(async (name, options) => {

      const savedRequest = getRequestByName(name);
      if (!savedRequest) {
        console.log(chalk.red(`Error: No saved request found with name '${name}'.`));
        console.log(chalk.gray('Use "api-ex ls" to see all saved requests.'));
        process.exit(1);
      }

      let requestConfig = {
        method: savedRequest.method,
        url: savedRequest.url,
        headers: {},
        data: savedRequest.data
      };

      //parse headers
      if (savedRequest.headers && savedRequest.headers.length > 0) {
        savedRequest.headers.forEach(h => {
          const colonIndex = h.indexOf(':');

          if (colonIndex === -1) {
            console.log(chalk.yellow(`Warning: Invalid header format '${h}'. Expected 'Key: Value'`));
            return;
          }

          const key = h.substring(0, colonIndex).trim();
          const value = h.substring(colonIndex + 1).trim();
          requestConfig.headers[key] = value;
        });
      }


      //header overrides if given
      if (options.header && options.header.length > 0) {
        options.header.forEach(h => {
          const colonIndex = h.indexOf(':');

          if (colonIndex === -1) {
            console.log(chalk.yellow(`Warning: Invalid header format '${h}'. Expected 'Key: Value'`));
            return;
          }

          const key = h.substring(0, colonIndex).trim();
          const value = h.substring(colonIndex + 1).trim();
          requestConfig.headers[key] = value;
        });
      }

      //data override if provided
      if (options.data) {
        requestConfig.data = options.data;
      }

      //if --env, interp
      if (options.env) {
        try {
          const env = getEnv(options.env);

          printDebug('Environment loaded', env);
          printDebug('Request before interpolation', requestConfig);

          requestConfig = interpolateRequest(requestConfig, env);
          printDebug('Request after interpolation', requestConfig);


        } catch (error) {
          console.log(chalk.red(`Error: ${error.message}`));
          console.log(chalk.gray('Use "api-ex env list" to see available environments.'));
          process.exit(1);

        }
      }



      const spinner = ora(`Running '${name}': ${requestConfig.method} ${requestConfig.url}`).start();

      try {
        printDebug('Final request config', requestConfig);
        const response = await sendRequest(requestConfig);
        spinner.stop();

        printSuccess(response, requestConfig.method, requestConfig.url);

        recordHistory({
          method: requestConfig.method,
          url: requestConfig.url,
          status: response.status,
          durationMs: response.durationMs,
          env: options.env || null,
          savedRequestName: name
        });


      } catch (error) {
        spinner.stop();
        printError(error, requestConfig.method, requestConfig.url);
        process.exit(2);

      }

    });
}

//repeatable options helper
function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;