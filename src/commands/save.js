//save command functionality
//save reusable requests
//uses commander for this

const chalk = require('chalk');
const {saveRequest, getRequestByName} = require('../core/storage');


//register the save command
function register(program) {
  program
    .command('save <name>')
    .description('Save a reusable request')
    .option('-X, --method <method>', 'HTTP method', 'GET')
    .option('-u, --url <url>', 'Request URL (required)')
    .option('-H, --header <header>', 'Request header (repeatable)', collect, [])
    .option('-d, --data <data>', 'Request body')
    .action(async (name, options) => {

      if (!options.url) {
        console.log(chalk.red('Error: --url is required.'));
        console.log(chalk.gray('Usage: api-ex save <name> --url <url> [options]'));
        process.exit(1);
      }

      //names with spaces
      if (/\s/.test(name)) {
        console.log(chalk.yellow('Warning: Request name contains spaces. This may cause issues when running the request.'));
        console.log(chalk.gray('Consider using dashes or underscores instead: my-request'));
      }

      //request already exists
      const existing = getRequestByName(name);
      if (existing) {
        console.log(chalk.yellow(`Warning: Request '${name}' already exists. Overwriting...`));
      }

      //store header as array
      const request = {
        name: name,
        method: options.method.toUpperCase(),
        url: options.url,
        headers: options.header,
        data: options.data || ''
      };

      saveRequest(request);
      console.log(chalk.green(`Saved request '${name}'`));

      //summary
      console.log(chalk.gray(`Method: ${request.method}`));
      console.log(chalk.gray(`URL: ${request.url}`));

      if (request.headers.length > 0) {
        console.log(chalk.gray(`Headers: ${request.headers.length}`));
      } 

      if (request.data) {
        console.log(chalk.gray(`  Body: ${request.data.substring(0, 50)}${request.data.length > 50 ? '...' : ''}`));
      }

    });
}

//helper for repeatable options
function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;