const _ = require("lodash");
const rimraf = require("rimraf");
const path = require("path");

const {
  COMMON_SCENARIO, ENDPOINT_SCENARIO, ENGINE_SCRIPT, INTEGRATION_EXAMPLE,
  BOILERPLATE_CONFIG, PUPPETEER_HOOK, INMDENT_JSON, COMMON_DIR
} = require("./vars");

const {
  readdir, mkdir, copyFile, createFile, unlink,
  sanitizeEndpoint
} = require("./utils");


/**
 * initialize boilerplate.
 * @param {Resolver} r Resolver instance
 */
async function initialize(r) {

  const backstop = require(r.backstop);

  await mkdir(r.cwdBoilerplate());

  copyFile(r.template(INTEGRATION_EXAMPLE), r.joinCwd(INTEGRATION_EXAMPLE));
  copyFile(r.template(BOILERPLATE_CONFIG), r.cwdBoilerplate(BOILERPLATE_CONFIG));
  copyFile(r.template(ENGINE_SCRIPT),  r.cwdBoilerplate(`${backstop.engine}_scripts.js`));
  copyFile(r.template(PUPPETEER_HOOK), r.cwdPuppetScript(PUPPETEER_HOOK));

  _replaceHook(r, "before", "onBefore");
  _replaceHook(r, "ready", "onReady");
};


/**
 * Synchronize between config and directory.
 * @param {Resolver} r Resolver instance
 */
async function syncTemplates(r) {

  const backstop = require(r.backstop);
  const boilerplate = require(r.boilerplate);
  
  _createCommonScenario(r, backstop);

  _createEndpointScenario(r, backstop, boilerplate);

  _removeDirectories(r.cwdBoilerplate(), _.keys(boilerplate.endpoints));
};


async function _replaceHook(r, prefix, file) {

  await copyFile(r.cwdPuppetScript(`${file}.js`), r.cwdPuppetScript(`${file}.js.backup`));

  await unlink(r.cwdPuppetScript(`${file}.js`));

  await createFile(
    r.cwdPuppetScript(`${file}.js`),
    `module.exports = require("./${PUPPETEER_HOOK}")("${prefix}", "${file}")`
  );
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


async function _createCommonScenario(r, backstop) {

  const template = require(r.template(COMMON_SCENARIO));

  for (const vpLabel of backstop.viewports)
    template[vpLabel.label] = { userAgent: "" };

  await mkdir(r.cwdBoilerplate(COMMON_DIR));
  createFile(
    r.cwdBoilerplate(COMMON_DIR, COMMON_SCENARIO),
    JSON.stringify(template, null, INMDENT_JSON)
  );
}


async function _createEndpointScenario(r, backstop,  boilerplate) {

  const template = require(r.template(ENDPOINT_SCENARIO))[boilerplate.templateType] || {};

  for (const endpoint in boilerplate.endpoints) {

    const endpoints = boilerplate.endpoints[endpoint];

    if (!endpoints || endpoints.length === 0)
      continue;

    const sanitized = sanitizeEndpoint(endpoint);
    await mkdir(r.cwdBoilerplate(sanitized));

    endpoints.forEach(scenarioName => {

      let obj = {};
      for (const viewport of backstop.viewports)
        obj[viewport.label] = template;

      createFile(
        r.cwdBoilerplate(sanitized, `${scenarioName}.json`),
        JSON.stringify(obj, null, INMDENT_JSON)
      )
    });
  }
}


module.exports = {
  initialize,
  syncTemplates
};