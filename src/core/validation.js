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



// Validate HTTP method
function validateHttpMethod(method) {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const upperMethod = method.toUpperCase();

  if (!validMethods.includes(upperMethod)) {
    throw new ValidationError(`Invalid HTTP method '${method}'. Valid methods: ${validMethods.join(', ')}.`);
  }

  return upperMethod;
}

// Validate timeout value
function validateTimeout(timeout) {
  const num = parseInt(timeout);

  if (isNaN(num) || num <= 0) {
    throw new ValidationError('Timeout must be a positive number in milliseconds.');
  }

  if (num > 600000) {
    throw new ValidationError('Timeout cannot exceed 600000ms (10 minutes).');
  }

  return num;
}

// Validate URL and provide helpful message
function validateUrl(url, allowPlaceholders = true) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required.');
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    throw new ValidationError('URL cannot be empty.');
  }

  // Check for placeholders
  const hasPlaceholders = /\{\{.*?\}\}/.test(trimmedUrl);

  if (allowPlaceholders && hasPlaceholders) {
    // Just check basic structure with placeholders
    const testUrl = trimmedUrl.replace(/\{\{.*?\}\}/g, 'placeholder');
    if (!isValidUrl(testUrl)) {
      throw new ValidationError(`Invalid URL format: ${url}`);
    }
  } else if (!isValidUrl(trimmedUrl)) {
    throw new ValidationError(`Invalid URL format: ${url}`);
  }

  return trimmedUrl;
}