//lowdb storage


const path = require('path');
const os = require('os');

const STORAGE_DIR = path.join(os.homedir(), '.api-ex');
const DATA_FILE = path.join(STORAGE_DIR, 'data.json');
const HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');
const CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');

function initStorage() {
  throw new Error('Not implemented yet');
}

function getRequests() {
  throw new Error('Not implemented yet');
}

function getRequestByName(name) {
  throw new Error('Not implemented yet');
}

function saveRequest(request) {
  throw new Error('Not implemented yet');
}

function getEnvironments() {
  throw new Error('Not implemented yet');
}

function saveEnvironment(name, variables) {
  throw new Error('Not implemented yet');
}

module.exports = {
  STORAGE_DIR,
  DATA_FILE,
  HISTORY_FILE,
  CONFIG_FILE,
  initStorage,
  getRequests,
  getRequestByName,
  saveRequest,
  getEnvironments,
  saveEnvironment
};