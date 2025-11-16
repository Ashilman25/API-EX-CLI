//request history

const chalk = require('chalk');
const {getHistory} = require('../core/history');
const {printTable} = require('../core/printer');

function register(program) {
  program
    .command('history')
    .description('View request history')
    .option('--limit <n>', 'Number of entries to show', '10')
    .option('--method <method>', 'Filter by HTTP method')
    .option('--status <status>', 'Filter by status code')
    .action(async (options) => {
      const limit = parseInt(options.limit) || 10;
      let history = GetHistory({limit});

      //filter by method
      if (options.method) {
        const methodFilter = options.method.toUpperCase();
        history = history.filter(entry => entry.method === methodFilter);
      }

      //filter by status
      if (options.status) {
        const statusFilter = parseInt(options.status);
        history = history.filter(entry => entry.status === statusFilter);
      }

      if (history.length === 0) {
        console.log(chalk.gray('No history yet.'));
        console.log(chalk.gray("Run 'api-ex request' or api-ex run' to create history entries."));
        return;
      }

      const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString();
      };

      



      
    });
}

module.exports = register;