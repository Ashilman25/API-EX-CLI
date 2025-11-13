//format the CLI output
//make look nice

const chalk = require('chalk');
const prettyjson = require('prettyjson');
const Table = require('cli-table3');


//status and pretty json
function printSuccess(response, method, url) {
  throw new Error('Not implemented yet');
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
