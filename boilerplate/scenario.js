const _ = require("lodash");

const { INC_JSON, COMMON_DIR } = require("./vars");
const { requireSafe, sanitizeEndpoint } = require("./utils");
const { getBackstopConfigPath, getBoilerplateConfigPath, cwdBoilerplate } = require("./resolve");

const backstop = require(getBackstopConfigPath());
const boilerplate = require(getBoilerplateConfigPath());


/**
 * Create scenario each endpoints, scenarios and viewports.
 * defined scenarios as 'skip' in configfile
 * will be skip when specific command execute.
 */
async function createScenarios(when) {

  if (boilerplate.skip && boilerplate.skip.when === when)
    for (const endpoint in boilerplate.skip.endpoints)
      boilerplate.endpoints[endpoint] = _.differenceWith(
        boilerplate.endpoints[endpoint],
        boilerplate.skip.endpoints[endpoint],
        _.isEqual
      );
  
  let result = [];
  for (const endpoint in boilerplate.endpoints)
    for (const scenarioName of boilerplate.endpoints[endpoint])
      for (const viewport of backstop.viewports)
        result = result.concat(
          await createScenario(new ScenarioID(endpoint, scenarioName, viewport))
        );

  return result;
}


/**
 * Create a scenario.
 * @param {ScenarioID} sId be subject to endpoint
 */
async function createScenario(sId) {

  const commonScenario = await requireSafe(cwdBoilerplate(COMMON_DIR, "common.json"));

  const endpointScenario = await requireSafe(cwdBoilerplate(sId.sanitizedEndpoint, `${sId.scenarioName}.json`));

  const scenarios = [
    commonScenario.all || {},
    commonScenario[sId.viewport.label] || {},
    endpointScenario.all || {},
    endpointScenario[sId.viewport.label] || {},
  ];

  const subscenarios = await getSubscenarios(sId, scenarios);
  
  const result = {
    label       : sId.label,
    url         : new URL(sId.endpoint, boilerplate.test).toString(),
    referenceUrl: new URL(sId.endpoint, boilerplate.reference).toString(),
    viewports   : [sId.viewport],

    ...await merge(scenarios, subscenarios)
  };

  return result;
}


/**
 * Load subsubscenarios from and common.json endpoint's scenairo.
 * @param {ScenarioID} sId be subject to endpoint
 * @param {Array} scenarios be subject to relational senarios
 */
async function getSubscenarios(sId, scenarios) {
  return Promise.all(scenarios.map((scenario, i) => new Promise(async resolve => resolve(

    await _.isArray(scenario[INC_JSON])
      ? Promise.all(scenario[INC_JSON].map(subscenarioName => new Promise(async innreResolve =>
          innreResolve({
            name: subscenarioName,
            json: await requireSafe(i == 0 || i == 1 // for common file
              ? cwdBoilerplate(COMMON_DIR, `${subscenarioName}.json`)
              : cwdBoilerplate(sId.sanitizedEndpoint, `${subscenarioName}.json`)
            )
          })
        )))

      : new Promise(innreResolve => innreResolve([])))
      
  )));
}


/**
 * Merge relational scenarios. see below about actual order.
 * 1. subscenarios in common.all
 * 2. common.all
 * 3. subscenarios in common.[viewport label]
 * 4. common.[viewport label]
 * 5. subscenarios in endpoint.all
 * 6. endpoint.all
 * 7. subscenarios in endpoint.[viewport label]
 * 8. endpoint.[viewport label]
 * (subscenarios order is ascend by index)
 * @param {Array} scenarios 
 * @param {Array} subscenarios 
 */
function merge(scenarios, subscenarios) {
  return scenarios.reduce((output, scenario, i) => {

    const mergedSubScenario = {};

    subscenarios[i].forEach(subscenario =>
      _mergeProperties(mergedSubScenario, _.cloneDeep(subscenario.json))
    );

    _mergeProperties(output, mergedSubScenario);
    _mergeProperties(output, _.cloneDeep(scenario));

    return output;

  }, {});
}


/**
 * Merge properties
 * Able to use custom prefix (-:, +:, =:) each properties.
 * The custom prefix works only Array. 
 * prefix [-:key] remove values from already defined in scenario when equal this property values.
 * prefix [+:key] merge values. (same no prefix case)
 * prefix [=:key] replace variable reference
 * @param {obejct} to merge to
 * @param {obejct} from merge from
 */
function _mergeProperties(to, from) {
  const arrayValues = { "=:": [], "+:": [], "-:": [] };

  for (const key in from) {

    const value = from[key];
    const clean = { value, key, match: key.match(/^[=\-\+]:/) };

    if (clean.match) {
      clean.key = key.replace(clean.match[0], "");
    }

    delete from[key];

    if (_.isArray(clean.value)) {

      clean.match
        ? arrayValues[clean.match[0]].push([to, key, clean])
        : arrayValues["+:"].push([to, key, clean]);

    } else {
      _.isObject(clean.value)
        ? mergeObject(to, key, clean)
        : mergePrimitive(to, clean);

    }
  }

  mergeArray(arrayValues);
}


/**
 * 
 * @param {*} to 
 * @param {*} key 
 * @param {*} clean 
 */
function mergeArray(arrayValues) {

  const functions = {
    "-:": (to, key, clean) => {
      _.isArray(to[clean.key])
        ? to[clean.key] = _.differenceWith(to[clean.key], clean.value, _.isEqual)
        : console.log(`scenario property "${key}" variable type was different.`);
    },

    "+:": (to, key, clean) =>
      to[clean.key] = _.uniqWith((to[clean.key] || []).concat(clean.value), _.isEqual),

    "=:": (to, key, clean) =>
      to[clean.key] = clean.value,
  };

  ["-:", "+:", "=:"].forEach(prefix =>
    arrayValues[prefix].forEach(arrayValue =>
      functions[prefix](...arrayValue)));
}


/**
 * 
 * @param {*} to 
 * @param {*} key 
 * @param {*} clean 
 */
function mergeObject(to, key, clean) {
  console.log("merge not suport for Object.");
  mergePrimitive(to, clean);
}


/**
 * 
 * @param {*} to 
 * @param {*} clean 
 */
function mergePrimitive(to, clean) {
  clean.value === "$delete" ? delete to[clean.key] : to[clean.key] = clean.value;
}


/**
 * ScenarioID class hold to scenario identify values.
 */
class ScenarioID {

  /**
   * Return label.
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
   * Return viewport.
   */
  get viewport() {
    return this._viewport;
  }

  /**
   * Return endpoint path.
   */
  get endpoint() {
    return this._endpoint;
  }

  /**
   * Return sanitized endpoint path.
   */
  get sanitizedEndpoint() {
    return this._sanitizedEndpoint;
  }

  constructor(endpoint, scenarioName, viewport) {
    this._label = `${endpoint}:${scenarioName}:${viewport.label}`;
    this._scenarioName = scenarioName;
    this._viewport = viewport;
    
    this._endpoint = endpoint.replace(/^index$/, "/");
    this._sanitizedEndpoint = sanitizeEndpoint(endpoint);
  }
}


module.exports = {
  createScenarios
};
