#!/usr/bin/env node

const {program} = require('commander')
const packageJson = require('../package.json')
const storage = require('./core/storage')
const {setDebugMode} = require('./core/debug')

// Initialize storage on startup
storage.initStorage();

//metadata
program
  .name('api-ex')
  .description('A fast, developer-friendly CLI for exploring and testing REST and GraphQL APIs')
  .version(packageJson.version, '-V, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command');

//some global options
program
  .option('--debug', 'Enable debug mode with verbose output')
  .option('--no-color', 'Disable colored output');

//set debug mode before any command runs
program.hook('preAction', (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.debug) {
    setDebugMode(true);
  }
});

//basic commands
require('./commands/request')(program);
require('./commands/save')(program);
require('./commands/run')(program);
require('./commands/ls')(program);
require('./commands/env')(program);
require('./commands/gql')(program);
require('./commands/history')(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

