//send ad-hoc HTTP requests

const ora = require('ora');
const chalk = require('chalk');

const {sendRequest} = require('../core/http');
const {getEnv, interpolateRequest} = require('../core/env');
const {recordHistory} = require('../core/history');
const {printSuccess, printError, printDebug} = require('../core/printer');
const {validateUrl, validateHttpMethod, validateTimeout, validateJsonData, validateEnvironmentName} = require('../core/validation');




function register(program) {
  program
    .command('request')
    .description('Send an ad-hoc HTTP request')
    .option('-X, --method <method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)', 'GET')
    .option('-u, --url <url>', 'Request URL (required)')
    .option('-H, --header <header>', 'Request header (repeatable)', collect, [])
    .option('-d, --data <data>', 'Request body (JSON or raw string)')
    .option('--env <env>', 'Environment name for variable interpolation')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
    .action(async (options) => {

      if (!options.url) {
        console.log(chalk.red('Error: --url is required.'));
        console.log(chalk.gray('Usage: api-ex request --url <url> [options]'));
        process.exit(1);
      }

      // Validate inputs
      let validatedMethod, validatedTimeout;
      try {
        validateUrl(options.url);
        validatedMethod = validateHttpMethod(options.method);
        validatedTimeout = validateTimeout(options.timeout);
        if (options.data) {
          validateJsonData(options.data);
        }
        if (options.env) {
          validateEnvironmentName(options.env);
        }
      } catch (error) {
        console.log(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }

      //parse headers from --header flags
      const headers = {};
      if (options.header && options.header.length > 0) {
        options.header.forEach(h => {
          const colonIndex = h.indexOf(':');

          if (colonIndex === -1) {
            console.log(chalk.yellow(`Warning: Invalid header format '${h}'. Expected 'Key: Value'`));
            return;
          }

          const key = h.substring(0, colonIndex).trim();
          const value = h.substring(colonIndex + 1).trim();
          headers[key] = value;
        });
      }

      let requestConfig = {
        method: validatedMethod,
        url: options.url,
        headers: headers,
        data: options.data,
        timeout: validatedTimeout
      };

      //if --env, load and interp
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

      const spinner = ora(`Sending ${requestConfig.method} ${requestConfig.url}`).start();

      //send request
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
          env: options.env || null
        });

      } catch (error) {
        spinner.stop();
        printError(error, requestConfig.method, requestConfig.url);
        process.exit(2);
      }
    });
}


function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;
