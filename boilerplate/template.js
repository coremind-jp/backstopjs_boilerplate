const _ = require("lodash");
const rimraf = require("rimraf");
const path = require("path");

const {
  COMMON_SCENARIO, ENDPOINT_SCENARIO, ENGINE_SCRIPT, INTEGRATION_EXAMPLE,
  BOILERPLATE_CONFIG, PUPPETEER_HOOK, INMDENT_JSON, COMMON_DIR, INC_JSON
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
 * Synchronize between boilerplate.json and directories.
 * @param {Resolver} r Resolver instance
 */
async function syncTemplates(r) {

  delete require.cache[r.boilerplate];

  const backstop = require(r.backstop);
  const boilerplate = require(r.boilerplate);
  
  await _createCommonScenario(r, backstop);
  await _createEndpointScenario(r, backstop, boilerplate);

  const definedPaths = _fetchScenarioPaths(r, backstop, boilerplate);

  await _createSubscenario(r, definedPaths);
  _removeDirectories(r, definedPaths);
};


async function _replaceHook(r, prefix, file) {

  await copyFile(r.cwdPuppetScript(`${file}.js`), r.cwdPuppetScript(`${file}.js.backup`));

  await unlink(r.cwdPuppetScript(`${file}.js`));

  await createFile(
    r.cwdPuppetScript(`${file}.js`),
    `module.exports = require("./${PUPPETEER_HOOK}")("${prefix}", "${file}")`
  );
};


function _removeDirectories(r, definedPaths) {

  readdir(r.cwdBoilerplate()).then(endpoints => endpoints  
    .filter(endpoint => endpoint.isDirectory())
    .forEach(endpoint => endpoint.name in definedPaths

      ? readdir(r.cwdBoilerplate(endpoint.name)).then(scenarios => scenarios
          .filter(scenario => scenario.isFile()
            && definedPaths[endpoint.name].scenarios.indexOf(scenario.name) == -1
            && definedPaths[endpoint.name].subscenarios.indexOf(scenario.name) == -1)
          .forEach(scenario =>
            rimraf(r.cwdBoilerplate(endpoint.name, scenario.name), () =>
              console.log(`[file removed] ${scenario.name}`)
            )))

      : rimraf(r.cwdBoilerplate(endpoint.name), () =>
          console.log(`[directory removed] ${endpoint.name}`)
        ))
  );
}


function _fetchScenarioPaths(r, backstop, boilerplate) {

  const result = {};
  const wrapper = (dir, file) =>
    _fetchSubscenarioPaths(result, r, dir, file, backstop.viewports);
  
  wrapper(COMMON_DIR, COMMON_SCENARIO);

  for (const endpoint in boilerplate.endpoints)
    if (0 < boilerplate.endpoints[endpoint].length)
      for (const scenarioName of boilerplate.endpoints[endpoint])
        wrapper(sanitizeEndpoint(endpoint), `${scenarioName}.json`);

  return result;
}


function _fetchSubscenarioPaths(result, r, endpoint, scenarioName, viewports) {

  delete require.cache[r.cwdBoilerplate(endpoint, scenarioName)];
  
  const scenario = require(r.cwdBoilerplate(endpoint, scenarioName));

  endpoint in result
    ? result[endpoint].scenarios.push(scenarioName)
    : result[endpoint] = { scenarios: [scenarioName], subscenarios: [] };

  [
    "all",
    ...viewports.map(viewport => viewport.label)
  ].forEach(label => result[endpoint].subscenarios.push(
    ...(
      scenario[label] && _.isArray(scenario[label][INC_JSON])
        ? scenario[label][INC_JSON].map(filename => `${filename}.json`)
        : []
    )
  ));

  result[endpoint].subscenarios = _.uniq(result[endpoint].subscenarios);
}


async function _createCommonScenario(r, backstop) {

  const template = require(r.template(COMMON_SCENARIO));

  await mkdir(r.cwdBoilerplate(COMMON_DIR));

  await createFile(
    r.cwdBoilerplate(COMMON_DIR, COMMON_SCENARIO),
    JSON.stringify(
      backstop.viewports.reduce((json, viewport) => {
        json[viewport.label] = { userAgent: "" };
        return json;
      }, template),
      null,
      INMDENT_JSON
    )
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

    for (const scenarioName of endpoints)
      await createFile(
        r.cwdBoilerplate(sanitized, `${scenarioName}.json`),
        JSON.stringify(
          backstop.viewports.reduce((json, viewport) => {
            json[viewport.label] = template;
            return json;
          }, {}),
          null,
          INMDENT_JSON)
        );
  }
}


async function _createSubscenario(r, definedPaths) {

  const template = require(r.template(ENDPOINT_SCENARIO))["max"];
  delete template["$subscenarios"];

  for (const endpoint in definedPaths)
    for (const subscenario of definedPaths[endpoint].subscenarios)
      await createFile(
        r.cwdBoilerplate(endpoint, subscenario),
        JSON.stringify(template, null, INMDENT_JSON)
      );
}


module.exports = {
  initialize,
  syncTemplates
};