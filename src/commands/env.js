///manage envs

const chalk = require('chalk');
const {saveEnvironment, getEnvironments, removeEnvironment} = require('../core/storage');
const {printTable} = require('../core/printer');
const {validateEnvironmentName} = require('../core/validation');


function register(program) {
    const env = program.command('env').description('Manage environments');


    //env add
    env
        .command('add <name> [variables...]')
        .description('Add or update an environment')
        .action(async (name, variables, options) => {

            // Validate environment name
            let validatedName;
            try {
                validatedName = validateEnvironmentName(name);
            } catch (error) {
                console.log(chalk.red(`Error: ${error.message}`));
                process.exit(1);
            }

            //pars vars
            const envVars = {};
            variables.forEach(v => {
                const [key, value] = v.split('=');

                if (key && value) {
                    envVars[key] = value;
                } else {
                    console.log(chalk.yellow(`Warning: Skipping invalid variable format: ${v}`));
                }
            });

            const varCount = Object.keys(envVars).length;
            if (varCount === 0) {
                console.log(chalk.red('Error: No valid variables provided.'));
                console.log(chalk.gray('Format: api-ex env add <name> KEY=value KEY2=value2'));
                process.exit(1);
                return;
            }

            saveEnvironment(validatedName, envVars);
            console.log(chalk.green(`Environment '${validatedName}' updated with ${varCount} variable(s)`));

            //show what was saved
            Object.keys(envVars).forEach(key => {
                console.log(chalk.gray(`  ${key}=${envVars[key]}`));
            });
            
    });


    //env list
    env
        .command('list')
        .alias('ls')
        .description('List all environments')
        .action(async (options) => {
            const environments = getEnvironments();

            const envNames = Object.keys(environments);
            if (envNames.length === 0) {
                console.log(chalk.gray('No environments defined.'));
                console.log(chalk.gray("Use 'api-ex env add' to create one."));
                return;
            }

            const headers = ['Environment', 'Variables'];
            const rows = envNames.map(name => [
                chalk.cyan(name),
                Object.keys(environments[name]).join(', ')
            ]);

            printTable(headers, rows);

    });

    

    //env rm
    env
        .command('rm <name>')
        .alias('remove')
        .description('Remove an environment')
        .action(async (name, options) => {

            // Validate environment name
            let validatedName;
            try {
                validatedName = validateEnvironmentName(name);
            } catch (error) {
                console.log(chalk.red(`Error: ${error.message}`));
                process.exit(1);
            }

            try {
                removeEnvironment(validatedName);
                console.log(chalk.green(`Environment '${validatedName}' removed.`));

            } catch (error) {
                console.log(chalk.red(`Error: ${error.message}`));
                console.log(chalk.gray('Use "api-ex env list" to see available environments.'));
                process.exit(1);
                return;
            }

    });

}

module.exports = register;