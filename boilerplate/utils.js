const fs = require("fs");


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
 * Wrapped fs.readFile by promise.
 * @param {*} path 
 */
function _readFile(path, options) {
  return new Promise((resolve, reject) => fs.readFile(path, options, (e, data) =>
    e ? reject(e): resolve(data)
  ))
};


/**
 * @param {*} path 
 */
async function readFile(path, options = { encoding: "utf-8", flag: "r" }) {
  return await exists(path, true) ? await _readFile(path, options): "";
};


/**
 * Wrapped fs.readdir by promise.
 * @param {*} path 
 */
function _readdir(path, options) {
  return new Promise((resolve, reject) => fs.readdir(path, options, (e, files) =>
    e ? reject(e): resolve(files)
  ))
};


/**
 * @param {*} path 
 */
 async function readdir(path, options = { encoding: "utf-8", withFileTypes: true }) {
  return await exists(path) ? await _readdir(path, options) : [];
}


/**
 * Use utils.exists function before call mkdir.
 * This method able to use async/await.
 * @param {*} path 
 */
 async function mkdir(path) {
  if (!await exists(path)) {
    await _mkdir(path);
    console.log(`[directory created] ${path}`);
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
 * Wrapped fs.rmdir promise.
 * @param {*} path 
 */
function _rmdir(path) {
  return new Promise((resolve, reject) => fs.rmdir(path, e => e ? reject(e): resolve()));
}


/**
 * Wrapped fs.rmdir promise.
 * @param {*} path 
 */
async function rmdir(path) {
  return await exists(path) ? await _rmdir(path): null;
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


function sanitizeEndpoint(endpoint) {
  return endpoint
    .replace(/\/#/g, "-")
    .replace(/\//g, "_")
    .replace(/#/g, "-")
    .replace(/_+$/, "")
    .replace(/^_+/, "");
}


module.exports = {
  mkdir,
  createFile,
  copyFile,
  readFile,
  unlink,
  readdir,
  rmdir,
  exists,
  sanitizeEndpoint,
};
