const fs = require("fs");
const path = require("path");


/**
 * Wrapped fs.access by promise.
 * @param {*} path 
 * @param {*} flgs 
 */
function _access(path, flgs) {
  return new Promise(resolve => fs.access(path, flgs, resolve));
}


/**
 * Wrapped fs.mkdir by promise.
 * @param {*} path 
 */
function _mkdir(path) {
  return new Promise(resolve => fs.mkdir(path, resolve));
}


/**
 * Use utils.exists function before call mkdir.
 * This method able to use async/await.
 * @param {*} path 
 */
 async function mkdir(path) {
  if (!await exists(path)) {
    await _mkdir(path);
    console.log(`[direcdestry created] ${path}`);
  }
}


/**
 * Wrapped fs.writeFile promise.
 * @param {*} path 
 * @param {*} data 
 */
function _writeFile(path, data) {
  return new Promise(resolve => fs.writeFile(path, data, resolve));
}


/**
 * Create a file if not exists file point to path.
 * This method able to use async/await.
 * @param {*} path 
 * @param {*} data 
 */
 async function createFile(path, data) {
  if (!await exists(path)) {
    if  (!await _writeFile(path, data))
      console.log(`[file created] ${path}`);
  }
}


/**
 * Wrapped fs.copyFile promise.
 * @param {*} src 
 * @param {*} dest 
 * @param {*} flgs 
 */
function _copyFile(src, dest, flgs = fs.constants.COPYFILE_EXCL) {
  return new Promise(resolve => fs.copyFile(src, dest, flgs, resolve));
}


/**
 * Copy a file if not exists file point to path.
 * This method able to use async/await.
 * @param {*} path 
 */
 async function copyFile(src, dest, flg) {
  if (!await _copyFile(src, dest, flg)) console.log(`[file created] ${dest}`);
}


/**
 * Wrapped fs.unlink promise.
 * @param {*} path 
 */
function unlink(path) {
  return new Promise(resolve => fs.unlink(path, resolve));
}


/**
 * Return boolean about exists file or directory.
 * @param {*} path 
 */
async function exists(path, log = false) {
  const e = await _access(path, fs.constants.W_OK | fs.constants.R_OK);
  if (e && e.code === "ENOENT") {
    if (log) console.info(`[INFO]: ${path} is not exists.`);
    return false;
  } else {
    return true;
  }
}


/**
 * Use utils.exists function before call require.
 * @param {*} uri 
 */
async function requireSafe(uri) {
  return await exists(uri, true) ? require(uri): {}
}


/**
 * Command parser and Label management class.
 * This instance parse to endpoint path on http and file.
 */
class ScenarioLabelParser {

  /**
   * Return scenario label.
   */
  get label() {
    return this._label;
  }

  /**
   * Return scenario filename.
   */
  get scenarioName() {
    return this._scenarioName;
  }

  /**
   * Return endpoint using a scenario.
   */
  get endpoint() {
    return this._endpoint;
  }

  /**
   * Return viewport label using a scenario.
   */
  get vpLabel() {
    return this._vpLabel;
  }

  /**
   * Return endpoints directory path for `require` by nodejs.
   */
  createEndpointsFilePath(filename) {
    return path.join(this._endpointRoot, filename);
  }

  /**
   * Return scenario path for `require` by nodejs.
   */
  createScenarioFilePath(filename) {
    return path.join(this._endpointRoot, this._endpointLocal, filename || `${this.scenarioName}.json`);
  }

  /**
   * Return endpoint URL with "domain" argument.
   */
  getUrl(domain) {
    return new URL(this.endpoint.replace(/^index$/, "/"), domain).toString();
  }

  constructor(endpoint, scenarioName, vpLabel, endpointRoot) {
    this._label = `${endpoint}:${scenarioName}:${vpLabel}`;
    this._scenarioName = scenarioName;
    this._vpLabel = vpLabel;
    
    this._endpointRoot = endpointRoot;
    this._endpoint = endpoint;
    this._endpointLocal = endpoint
      .replace(/\/#/g, "-")
      .replace(/\//g, "_")
      .replace(/#/g, "-")
      .replace(/_+$/, "")
      .replace(/^_+/, "");
  }
}


module.exports = {
  ScenarioLabelParser,
  mkdir,
  createFile,
  copyFile,
  unlink,
  exists,
  requireSafe,
}
