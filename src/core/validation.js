const chalk = require('chalk');
const {ValidationError} = require('./errors');

//validate url format
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const testUrl = url.replace(/\{\{.*?\}\}/g, 'placeholder');
    new URL(testUrl);
    return true;

  } catch {
    return false;
  }
}

//validate JSON
function isValidJson(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }

  try {
    JSON.parse(str);
    return true;

  } catch {
    return false;
  }
}