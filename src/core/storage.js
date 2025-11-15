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



//saved requests
function getRequests() {
  const db = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  return db.get('requests').value();
}


//requests by name, null if not
function getRequestByName(name) {
  const requests = getRequests();
  const request = requests.find(r => r.name === name);

  return request || null;
}




//save or update requests
//request = name, method, url, headers, data
function saveRequest(request) {
  const db = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  //if request with same name exists
  const requests = db.get('requests').value();
  const existingIndex = requests.findIndex(r => r.name === request.name);

  //update else make new
  if (existingIndex !== -1) {
    db.get('requests').nth(existingIndex).assign(request).write();

  } else {
    db.get('requests').push(request).write();
  }
}





function getEnvironments() {
  const db = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  return db.get('environments').value();
}


//save or update env
function saveEnvironment(name, variables) {
  const db = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  db.set(`environments.${name}`, variables).write();
}


//remove env
function removeEnvironment(name) {
  const db = getDb(DATA_FILE, {
    requests: [],
    environments: {}
  });

  if (!db.get('environments').value()[name]) {
    throw new Error(`Environment '${name}' does not exist`);
  }

  db.unset(`environments.${name}`).write();
}


//get storage dir path
function getStorageDir() {
  return STORAGE_DIR;
}

//data file path
function getDataFile() {
  return DATA_FILE;
}

//history file path
function getHistoryFile() {
  return HISTORY_FILE;
}



module.exports = {
  STORAGE_DIR,
  DATA_FILE,
  HISTORY_FILE,
  CONFIG_FILE,
  getStorageDir,
  getDataFile,
  getHistoryFile,
  setStorageDir,
  initStorage,
  getRequests,
  getRequestByName,
  saveRequest,
  getEnvironments,
  saveEnvironment,
  removeEnvironment
};