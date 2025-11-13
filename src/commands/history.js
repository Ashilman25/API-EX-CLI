//request history

function register(program) {
  program
    .command('history')
    .description('View request history')
    .option('--limit <n>', 'Number of entries to show', '10')
    .option('--method <method>', 'Filter by HTTP method')
    .option('--status <status>', 'Filter by status code')
    .action(async (options) => {

      console.log('History command not implemented yet');
      console.log('Options:', options);
      
    });
}

module.exports = register;