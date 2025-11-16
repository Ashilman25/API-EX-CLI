//format the CLI output
//make look nice

const chalk = require('chalk'); //colors
const prettyjson = require('prettyjson');
const Table = require('cli-table3'); //auto table

const {isDebugMode} = require('./debug');


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
  console.log(chalk.red(`${method} ${url} ==> ERROR`));
  console.log(chalk.red(`Error: ${error.message}`));

  //if response data, show snippet
  if (error.response) {
    console.log(chalk.yellow(`Status: ${error.response.status} ${error.response.statusText}`));

    if (error.response.data) {
      let dataStr;
      if (typeof error.response.data === 'string') {
        dataStr = error.response.data;
      } else {
        dataStr = JSON.stringify(error.response.data);
      }

      const snippet = dataStr.substring(0, 200);
      console.log(chalk.gray(`Response: ${snippet}${dataStr.length > 200 ? '...' : ''}`));

    }
  }

  //help suggestions if applicable
  if (error.code === 'ENOTFOUND') {
    console.log(chalk.gray('\nTip: Check if the URL is correct and you have internet connectivity.'));

  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    console.log(chalk.gray('\nTip: The request timed out. Try increasing the timeout with --timeout option.'));

  } else if (error.response && error.response.status === 404) {
    console.log(chalk.gray('\nTip: The endpoint was not found. Verify the URL path is correct.'));

  } else if (error.response && error.response.status === 401) {
    console.log(chalk.gray('\nTip: Authentication failed. Check your credentials or API key.'));

  }
}



//use cli-tabl3
function printTable(headers, rows) {
  const table = new Table({head: headers});
  table.push(...rows);
  console.log(table.toString());
}


//if debug mode on
function printDebug(label, data) {
  if (isDebugMode()) {
    console.log(chalk.cyan(`[DEBUG] ${label}:`));
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}




module.exports = {
  printSuccess,
  printError,
  printTable,
  printDebug
};
