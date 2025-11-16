//debug mode

let debugEnabled = false;

function setDebugMode(enabled) {
  debugEnabled = enabled;
}

function isDebugMode() {
  return debugEnabled || process.env.API_EX_DEBUG === '1';
}

module.exports = {setDebugMode, isDebugMode};
