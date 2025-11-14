//format the CLI output
//make look nice

const chalk = require('chalk'); //colors
const prettyjson = require('prettyjson');
const Table = require('cli-table3'); //auto table


//status and pretty json
function printSuccess(response, method, url) {
  console.log(chalk.green(`${method} ${url} ==> ${response.status} ${response.statusText} (${response.durationMs}ms)`));

  if (response.data && typeof response.data === 'object') {
    console.log(prettyjson.render(response.data));
  } else {
    console.log(response.data); //plain text
  }
}



//error msg and details
function printError(error, method, url) {
  throw new Error('Not implemented yet');
}



//use cli-tabl3
function printTable(headers, rows) {
  throw new Error('Not implemented yet');
}


//if debug mode on
function printDebug(label, data) {
  throw new Error('Not implemented yet');
}

module.exports = {
  printSuccess,
  printError,
  printTable,
  printDebug
};
