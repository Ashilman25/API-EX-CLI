//list saved requests

const chalk = require('chalk');
const {getRequests} = require('../core/storage');
const {printTable} = require('../core/printer');


function register(program) {
  program
    .command('ls')
    .description('List all saved requests')
    .option('--verbose -v', 'Show detailed information')
    .option('--filter <text>', 'Filter requests by name')
    .action(async (options) => {

      const requests = getRequests();
      if (requests.length === 0) {
        console.log(chalk.gray('No saved requests.'));
        console.log(chalk.gray("Use 'api-ex save' to create one."));
        return;
      }

      //filter if provided
      let filtered = requests;
      if (options.filter) {
        filtered = requests.filter(r => r.name.toLowerCase().includes(options.filter.toLowerCase()));

        if (filtered.length === 0) {
          console.log(chalk.yellow(`No requests found matching '${options.filter}'`));
          console.log(chalk.gray(`Total saved requests: ${requests.length}`));
          return;
        }
      }

      //build table data | verbose else normal
      //verbose mode = headers + body
      //normal mode = name + method + url
      if (options.verbose) {
        const headers = ['Name', 'Method', 'URL', 'Headers', "Body"];
        const rows = filtered.map(r => {
          let name = chalk.cyan(r.name);
          let method = chalk.yellow(r.method);

          //url trunc
          let url;
          if (r.url.length > 40) {
            url = r.url.substring(0, 40) + '...';
          } else {
            url = r.url;
          }

          let headerCount;
          if (r.headers && r.headers.length > 0) {
            headerCount = r.headers.length.toString();
          } else {
            headerCount = '-';
          }

          //data trunc
          let data;
          if (r.data) {
            if (r.data.length > 20) {
              data = r.data.substring(0, 20) + '...';
            } else {
              data = r.data;
            }
          } else {
            data = '-';
          }

          return [name, method, url, headerCount, data];
          
        });

        printTable(headers, rows);

      } else {
        const headers = ['Name', 'Method', 'URL'];
        const rows = filtered.map(r => [
          chalk.cyan(r.name),
          chalk.yellow(r.method),
          r.url
        ]);

        printTable(headers, rows);

      }
      
      console.log(chalk.gray(`\nTotal: ${filtered.length} request(s)`));

      if (options.filter && filtered.length < requests.length) {
        console.log(chalk.gray(`Showing filtered results. Total saved: ${requests.length}`));
      }

      
    });
}

module.exports = register;
