//send ad-hoc HTTP requests



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

      console.log('Request command not implemented yet');
      console.log('Options:', options);

    });
}


function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;
