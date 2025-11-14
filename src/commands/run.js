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
        console.log(chalk.red(`Error: No saved request found with name '${name}'`));
        console.log(chalk.gray(`Use 'api-ex ls' to see all saved requests`));
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

      

    });
}

//repeatable options helper
function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;