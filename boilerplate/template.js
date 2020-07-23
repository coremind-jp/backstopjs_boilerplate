const _ = require("lodash");
const rimraf = require("rimraf");

const R = require("./resolver");

const {
  ENGINE_SCRIPT, INTEGRATION_EXAMPLE,
  TEMPLATE_COMMON, TEMPLATE_ENDPOINT, TEMPLATE_SUBSCENARIO,
  BOILERPLATE_CONFIG, PUPPETEER_HOOK, INMDENT_JSON, COMMON_DIR, INC_JSON
} = require("./vars");

const {
  readdir, mkdir, copyFile, createFile, unlink,
  sanitizeEndpoint
} = require("./utils");


/**
 * initialize boilerplate.
 */
async function initialize() {

  const backstop = require(R.backstop);

  copyFile(R.template(INTEGRATION_EXAMPLE), R.joinCwd(INTEGRATION_EXAMPLE));

  await mkdir(R.cwdBoilerplate());  
  copyFile(R.template(BOILERPLATE_CONFIG), R.cwdBoilerplate(BOILERPLATE_CONFIG));
  copyFile(R.template(ENGINE_SCRIPT),  R.cwdBoilerplate(`${backstop.engine}_scripts.js`));
  copyFile(R.template(TEMPLATE_ENDPOINT), R.cwdBoilerplate(TEMPLATE_ENDPOINT));
  copyFile(R.template(TEMPLATE_SUBSCENARIO), R.cwdBoilerplate(TEMPLATE_SUBSCENARIO));

  copyFile(R.template(PUPPETEER_HOOK), R.cwdPuppetScript(PUPPETEER_HOOK));
  _replaceHook("before", "onBefore");
  _replaceHook("ready", "onReady");
};


/**
 * Synchronize between boilerplate.json and directories.
 */
async function syncTemplates() {

  delete require.cache[R.boilerplate];

  const backstop = require(R.backstop);
  const boilerplate = require(R.boilerplate);
  
  await _createCommonScenario(backstop);
  await _createEndpointScenario(backstop, boilerplate);

  const definedPaths = _fetchScenarioPaths(backstop, boilerplate);

  await _createSubscenario(definedPaths);
  _removeDirectories(definedPaths);
};


async function _replaceHook(prefix, file) {

  await copyFile(R.cwdPuppetScript(`${file}.js`), R.cwdPuppetScript(`${file}.js.backup`));

  await unlink(R.cwdPuppetScript(`${file}.js`));

  await createFile(
    R.cwdPuppetScript(`${file}.js`),
    `module.exports = require("./${PUPPETEER_HOOK}")("${prefix}", "${file}")`
  );
};


function _removeDirectories(definedPaths) {

  readdir(R.cwdBoilerplate()).then(endpoints => endpoints  
    .filter(endpoint => endpoint.isDirectory())
    .forEach(endpoint => endpoint.name in definedPaths

      ? readdir(R.cwdBoilerplate(endpoint.name)).then(scenarios => scenarios
          .filter(scenario => scenario.isFile()
            && definedPaths[endpoint.name].scenarios.indexOf(scenario.name) == -1
            && definedPaths[endpoint.name].subscenarios.indexOf(scenario.name) == -1)
          .forEach(scenario =>
            rimraf(R.cwdBoilerplate(endpoint.name, scenario.name), () =>
              console.log(`[file removed] ${scenario.name}`)
            )))

      : rimraf(R.cwdBoilerplate(endpoint.name), () =>
          console.log(`[directory removed] ${endpoint.name}`)
        ))
  );
}


function _fetchScenarioPaths(backstop, boilerplate) {

  const result = {};
  const wrapper = (dir, file) =>
    _fetchSubscenarioPaths(result, dir, file, backstop.viewports);
  
  wrapper(COMMON_DIR, TEMPLATE_COMMON);

  for (const endpoint in boilerplate.endpoints)
    if (0 < boilerplate.endpoints[endpoint].length)
      for (const scenarioName of boilerplate.endpoints[endpoint])
        wrapper(sanitizeEndpoint(endpoint), `${scenarioName}.json`);

  return result;
}


function _fetchSubscenarioPaths(result, endpoint, scenarioName, viewports) {

  delete require.cache[R.cwdBoilerplate(endpoint, scenarioName)];
  
  const scenario = require(R.cwdBoilerplate(endpoint, scenarioName));

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


async function _createCommonScenario(backstop) {

  const template = require(R.template(TEMPLATE_COMMON));

  await mkdir(R.cwdBoilerplate(COMMON_DIR));

  await createFile(
    R.cwdBoilerplate(COMMON_DIR, TEMPLATE_COMMON),
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


async function _createEndpointScenario(backstop,  boilerplate) {

  const template = require(R.cwdBoilerplate(TEMPLATE_ENDPOINT));

  for (const endpoint in boilerplate.endpoints) {

    const endpoints = boilerplate.endpoints[endpoint];

    if (!endpoints || endpoints.length === 0)
      continue;

    const sanitized = sanitizeEndpoint(endpoint);
    await mkdir(R.cwdBoilerplate(sanitized));

    for (const scenarioName of endpoints)
      await createFile(
        R.cwdBoilerplate(sanitized, `${scenarioName}.json`),
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


async function _createSubscenario(definedPaths) {

  for (const endpoint in definedPaths)
    for (const subscenario of definedPaths[endpoint].subscenarios)
      await copyFile(
        R.cwdBoilerplate(TEMPLATE_SUBSCENARIO),
        R.cwdBoilerplate(endpoint, subscenario)
      );
}


module.exports = {
  initialize,
  syncTemplates
};