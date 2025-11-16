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


// Validate request name
function validateRequestName(name) {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Request name is required.');
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ValidationError('Request name cannot be empty.');
  }

  if (trimmedName.length > 50) {
    throw new ValidationError('Request name too long (max 50 characters).');
  }

  //problem chars
  if (/[\/\\:*?"<>|]/.test(trimmedName)) {
    throw new ValidationError('Request name contains invalid characters (/, \\, :, *, ?, ", <, >, |).');
  }

  //spaces warning
  if (/\s/.test(trimmedName)) {
    console.log(chalk.yellow('Warning: Request name contains spaces. This may cause issues when running the request.'));
    console.log(chalk.gray('Consider using dashes or underscores instead: my-request'));
  }

  return trimmedName;
}



// Validate env name
function validateEnvironmentName(name) {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Environment name is required.');
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ValidationError('Environment name cannot be empty.');
  }

  if (trimmedName.length > 50) {
    throw new ValidationError('Environment name too long (max 50 characters).');
  }

  if (/[\/\\:*?"<>|]/.test(trimmedName)) {
    throw new ValidationError('Environment name contains invalid characters (/, \\, :, *, ?, ", <, >, |).');
  }

  return trimmedName;
}