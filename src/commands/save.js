//save command functionality
//save reusable requests
//uses commander for this



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

      console.log(`Save command not implemented yet. Name: ${name}`);
      console.log('Options:', options);
      
    });
}

//helper for repeatable options
function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;