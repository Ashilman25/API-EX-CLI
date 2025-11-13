//lowdb storage


const path = require('path');
const os = require('os');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let STORAGE_DIR = process.env.API_EX_STORAGE_DIR || path.join(os.homedir(), '.api-ex');
let DATA_FILE = path.join(STORAGE_DIR, 'data.json');
let HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');
let CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');


//configure storage paths
//for test mostly
function setStorageDir(storageDir) {
  STORAGE_DIR = storageDir;
  DATA_FILE = path.join(STORAGE_DIR, 'data.json');
  HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');
  CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');
}



//get db for given file
function getDb(filePath, defaultData) {
  const adapter = new FileSync(filePath);
  const db = low(adapter);

  //if empty set default
  db.defaults(defaultData).write();
  return db;
}



//initialize storage dir and jsons
function initStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, {recursive: true}); //check ~/.api-ex/ make if not exists
  }

  //data.json
  const dataDb = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  //history.json
  const historyDb = getDb(HISTORY_FILE, {
    history: []
  });

  return {dataDb, historyDb};
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