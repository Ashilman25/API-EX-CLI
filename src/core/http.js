const axios = require('axios');
const {printDebug} = require('./printer');
const {NetworkError, ValidationError} = require('./errors');

//http request sending with axios
//request = method, url, headers, data, timeout
//promsise obj = normalized response with status, statusText, headers, data, duration
async function sendRequest(config) {
  if (!config) {
    throw new ValidationError('Request configuration is required');
  }

  if (!config.method) {
    throw new ValidationError('Request method is required');
  }

  if (!config.url) {
    throw new ValidationError('Request URL is required');
  }

  const timeout = config.timeout || 30000;
  const headers = config.headers || {};

  if (!headers['Content-Type'] && !headers['content-type'] && config.data) {
    headers['Content-Type'] = 'application/json';
  }

  const startTime = Date.now();

  //axios request
  try {
    const axiosConfig = {
      method: config.method,
      url: config.url,
      headers: headers,
      data: config.data,
      timeout: timeout,
      validateStatus: () => true //all status codes good
    };

    printDebug('Axios config', {
      method: axiosConfig.method,
      url: axiosConfig.url,
      headers: axiosConfig.headers,
      data: axiosConfig.data,
      timeout: axiosConfig.timeout
    });

    const response = await axios(axiosConfig);

    const durationMs = Date.now() - startTime;

    printDebug('Response headers', response.headers);

    //normalized response
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      durationMs: durationMs
    };


  } catch (error) {

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      //timeout error
      throw new NetworkError(`Request timeout after ${timeout}ms: ${config.method} ${config.url}`);

    } else if (error.response) {
      //error status code, shouldnt happen tho cuz i accept all status codes
      throw new NetworkError(`HTTP ${error.response.status}: ${error.response.statusText}`);

    } else if (error.request) {
      //network error, request made but no response
      throw new NetworkError(`Unable to reach ${config.url}. ${error.message}`);

    } else {
      throw new NetworkError(`Request failed: ${error.message}`);

    }
  }
}


module.exports = {
  sendRequest
};