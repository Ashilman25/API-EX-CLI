//save command functionality
//save reusable requests
//uses commander for this

const chalk = require('chalk');
const {saveRequest, getRequestByName} = require('../core/storage');
const {validateRequestName, validateUrl, validateHttpMethod, validateJsonData} = require('../core/validation');


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

      // Validate inputs
      let validatedName, validatedMethod;
      try {
        validatedName = validateRequestName(name);
        validateUrl(options.url);
        validatedMethod = validateHttpMethod(options.method);
        if (options.data) {
          validateJsonData(options.data);
        }
      } catch (error) {
        console.log(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }

      //request already exists
      const existing = getRequestByName(validatedName);
      if (existing) {
        console.log(chalk.yellow(`Warning: Request '${validatedName}' already exists. Overwriting...`));
      }

      //store header as array
      const request = {
        name: validatedName,
        method: validatedMethod,
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