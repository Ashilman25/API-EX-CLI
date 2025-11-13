///manage envs



function register(program) {
    const env = program.command('env').description('Manage environments');


    //env add
    env
        .command('add <name> [variables...]')
        .description('Add or update an environment')
        .action(async (name, variables, options) => {

            console.log(`Environment add not implemented yet. Name: ${name}`);
            console.log('Variables:', variables);

    });


    //env list
    env
        .command('list')
        .alias('ls')
        .description('List all environments')
        .action(async (options) => {
            
            console.log('Environment list not implemented yet');

    });

    //env rm 
    env
        .command('rm <name>')
        .alias('remove')
        .description('Remove an environment')
        .action(async (name, options) => {
            
            console.log(`Environment remove not implemented yet. Name: ${name}`);

    });

}

module.exports = register;