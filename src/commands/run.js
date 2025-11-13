//run command




function register(program) {
  program
    .command('run <name>')
    .description('Execute a saved request')
    .option('--env <env>', 'Environment name for variable interpolation')
    .option('-H, --header <header>', 'Override request header (repeatable)', collect, [])
    .option('-d, --data <data>', 'Override request body')
    .action(async (name, options) => {

      console.log(`Run command not implemented yet. Request: ${name}`);
      console.log('Options:', options);

    });
}

//repeatable options helper
function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;