//send graph ql queries and mutations

function register(program) {
  program
    .command('gql')
    .description('Send GraphQL queries and mutations')
    .requiredOption('--endpoint <url>', 'GraphQL endpoint URL')
    .option('--query <query>', 'Inline GraphQL query')
    .option('--file <path>', 'Path to .gql or .graphql file')
    .option('--variables <json>', 'Variables as JSON string')
    .option('--env <env>', 'Environment name for variable interpolation')
    .option('-H, --header <header>', 'Request header (repeatable)', collect, [])
    .action(async (options) => {

      console.log('GraphQL command not implemented yet');
      console.log('Options:', options);

    });
}


function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = register;
