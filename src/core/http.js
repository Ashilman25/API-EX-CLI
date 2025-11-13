const axios = require('axios');

//http request sending with axios
//request = method, url, headers, data, timeout
//promsise obj = normalized response with status, statusText, headers, data, duration
async function sendRequest(config) {
  if (!config) {
    throw new Error('Request configuration is required');
  }

  if (!config.method) {
    throw new Error('Request method is required');
  }

  if (!config.url) {
    throw new Error('Request URL is required');
  }

  const timeout = config.timeout || 30000;
  const headers = config.headers || {};

  if (!headers['Content-Type'] && !headers['content-type'] && config.data) {
    headers['Content-Type'] = 'application/json';
  }

  const startTime = Date.now();

  //axios request
  try {
    const response = await axios({
      method: config.method,
      url: config.url,
      headers: headers,
      data: config.data,
      timeout: timeout,
      validateStatus: () => true //all status codes good
    });

    const durationMs = Date.now() - startTime;

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
      throw new Error(`Request timeout after ${timeout}ms: ${config.method} ${config.url}`);

    } else if (error.response) { 
      //error status code, shouldnt happen tho cuz i accept all status codes
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);

    } else if (error.request) {
      //network error, request made but no response
      throw new Error(`Network error: Unable to reach ${config.url}. ${error.message}`);

    } else {
      throw new Error(`Request failed: ${error.message}`);

    }
  }
}


module.exports = {
  sendRequest
};