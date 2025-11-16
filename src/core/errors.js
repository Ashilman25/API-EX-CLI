//custom error classes

class ApiExError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.name = 'ApiExError';
    this.code = code;
  }
}

class NetworkError extends ApiExError {
  constructor(message) {
    super(message, 2);
    this.name = 'NetworkError';
  }
}

class ValidationError extends ApiExError {
  constructor(message) {
    super(message, 1);
    this.name = 'ValidationError';
  }
}

class ConfigurationError extends ApiExError {
  constructor(message) {
    super(message, 1);
    this.name = 'ConfigurationError';
  }
}

class FileSystemError extends ApiExError {
  constructor(message) {
    super(message, 2);
    this.name = 'FileSystemError';
  }
}

module.exports = {
  ApiExError,
  NetworkError,
  ValidationError,
  ConfigurationError,
  FileSystemError
};
