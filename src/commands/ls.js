//list saved requests


function register(program) {
  program
    .command('ls')
    .description('List all saved requests')
    .option('--verbose', 'Show detailed information')
    .option('--filter <text>', 'Filter requests by name')
    .action(async (options) => {

      console.log('List command not implemented yet');
      console.log('Options:', options);
      
    });
}

module.exports = register;
