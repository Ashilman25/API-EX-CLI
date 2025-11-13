//request history for user to see

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const storage = require('./storage');


//db per history file
function getHistoryDb() {
  const historyFile = storage.getHistoryFile();
  const adapter = new FileSync(historyFile);
  const db = low(adapter);

  db.defaults({history: []}).write();
  return db;

}



//just append to history.json with timestamp 
//entry = method, url, status, durationMs, env, savedRequestName
function recordHistory(entry) {
  if (!entry) {
    throw new Error('History entry is required');
  }

  const db = getHistoryDb();
  const entryWithTimestamp = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  db.get('history').push(entryWithTimestamp).write();
}







//to output record history when user wants to see
function getHistory(options = {}) {
  throw new Error('Not implemented yet');
}

module.exports = {
  recordHistory,
  getHistory
};