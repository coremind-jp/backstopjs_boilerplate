const _ = require("lodash");
const rimraf = require("rimraf");
const path = require("path");

const {
  COMMON_SCENARIO, ENDPOINT_SCENARIO, ENGINE_SCRIPT,
  CONF_FILE_NAME, PUPPETEER_HOOK, INMDENT_JSON, COMMON_DIR
} = require("./vars");

const { readdir, mkdir, copyFile, createFile, unlink, sanitizeEndpoint } = require("./utils");
const { getBackstopConfigPath, pkgTemplates, cwdPuppetScript, cwdBoilerplate } = require("./resolve");

const backstop = require(getBackstopConfigPath());


/**
 * initialize boilerplate.
 */
async function initialize() {
  await mkdir(cwdBoilerplate());

  await copyFile(pkgTemplates(CONF_FILE_NAME), cwdBoilerplate(CONF_FILE_NAME));
  await copyFile(pkgTemplates(PUPPETEER_HOOK), cwdPuppetScript(PUPPETEER_HOOK));

  await _replaceHook("before", "onBefore");
  await _replaceHook("ready", "onReady");
};


/**
 * Synchronize between config and directory.
 * @param {*} boilerplate boilerplate config object
 */
async function syncTemplates(boilerplate) {
  
  await _createCommonScenario();
  copyFile(pkgTemplates(ENGINE_SCRIPT), cwdPuppetScript(`${backstop.engine}_scripts.js`));

  for (const endpoint in boilerplate.endpoints) {
    await mkdir(cwdBoilerplate(endpoint));

    boilerplate.endpoints[endpoint].forEach(scenarioName =>
      _createEndpointScenario(cwdBoilerplate(endpoint, `${scenarioName}.json`), boilerplate)
    );
  }
  
  _removeDirectories(cwdBoilerplate(), _.keys(boilerplate.endpoints));
};


async function _replaceHook(prefix, file) {
  console.log(`[${file}.js] backup`);

  await copyFile(cwdPuppetScript(`${file}.js`), cwdPuppetScript(`${file}.js.backup`));

  await unlink(cwdPuppetScript(`${file}.js`));

  await createFile(
    cwdPuppetScript(`${file}.js`),
    `module.exports = require("./${PUPPETEER_HOOK}")("${prefix}", "${file}")`
  );

  console.log(`[${file}.js] recreated`);
};


async function _removeDirectories(parent, children) {
  const whiteList = [COMMON_DIR];
  const entities = await readdir(parent);

  const removeList = _.differenceWith(
    entities.filter(entity => entity.isDirectory()).map(entity => entity.name),
    whiteList.concat(children).map(sanitizeEndpoint),
    _.isEqual
  );

  for (const child of removeList)
    if (whiteList.indexOf(child) === -1)
      rimraf(path.join(parent, child), () => console.log("[directory removed", child));
}


async function _createEndpointScenario(cwdPath, boilerplate) {
  const template = require(pkgTemplates(ENDPOINT_SCENARIO));
  let reslult = {};

  for (const vpLabel of backstop.viewports)
    reslult[vpLabel] = template[boilerplate.templateType] || template.max;

  await createFile(cwdPath, JSON.stringify(reslult, null, INMDENT_JSON));
}


async function _createCommonScenario() {
  const template = require(pkgTemplates(COMMON_SCENARIO));

  for (const vpLabel of backstop.viewports)
    template[vpLabel.label] = { userAgent: "" };

  await createFile(cwdBoilerplate(COMMON_DIR, COMMON_SCENARIO), JSON.stringify(template, null, INMDENT_JSON));
}


module.exports = {
  initialize,
  syncTemplates
};