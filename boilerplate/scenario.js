const URL = require("url").URL;
const _ = require("lodash");

const { INC_JSON, COMMON_DIR, COMMON_SCENARIO, UNDEFINED_SCENARIO } = require("./vars");
const { sanitizeEndpoint } = require("./utils");


/**
 * Create scenario each endpoints, scenarios and viewports.
 * defined scenarios as 'skip' in configfile
 * will be skip when specific command execute.
 * @param {Resolver} r Resolver instance
 * @param {string} when execute command
 */
function createScenarios(r, when) {

  const backstop = require(r.backstop);
  const boilerplate = require(r.boilerplate);

  _pushAlias(boilerplate);

  _applySkipFilter(boilerplate, when);

  let result = [];
  for (const endpoint in boilerplate.endpoints)
    for (const scenarioName of boilerplate.endpoints[endpoint])
      for (const viewport of backstop.viewports)
        result = result.concat(
          _createScenario(r, new ScenarioID(endpoint, scenarioName, viewport), boilerplate)
        );

  return result;
}


/**
 * Apply skip filter to scenarios.
 * @param {object} boilerplate config for boilerplate
 */
function _applySkipFilter(boilerplate, when) {

  if (!boilerplate.skip
  ||  !boilerplate.skip.when
  ||   boilerplate.skip.when !== when
  ||  !boilerplate.skip.endpoints)
    return;

  for (const endpoint in boilerplate.skip.endpoints) {

    boilerplate.skip.endpoints[endpoint].length === 0
      ? delete boilerplate.endpoints[endpoint]

      : boilerplate.endpoints[endpoint] = _.differenceWith(
        boilerplate.endpoints[endpoint],
        boilerplate.skip.endpoints[endpoint],
        _.isEqual
      );
  }
}


/**
 * Push alias as default scenarioa for empty array endpoints.
 * @param {*} r 
 * @param {*} sId 
 * @param {*} boilerplate 
 */
function _pushAlias(boilerplate) {

  for (const endpoint in boilerplate.endpoints)
    if (boilerplate.endpoints[endpoint].length === 0)
      boilerplate.endpoints[endpoint].push(UNDEFINED_SCENARIO);
}


/**
 * Create a scenario.
 * @param {Resolver} r Resolver instance
 * @param {ScenarioID} sId ScenarioID instance
 * @param {object} boilerplate config for boilerplate
 */
function _createScenario(r, sId, boilerplate) {

  const commonScenario = require(r.cwdBoilerplate(COMMON_DIR, COMMON_SCENARIO));

  const endpointScenario = sId.scenarioName === UNDEFINED_SCENARIO
    ? {}
    : require(r.cwdBoilerplate(sId.sanitizedEndpoint, `${sId.scenarioName}.json`));

  const scenarios = [
    commonScenario.all || {},
    commonScenario[sId.viewport.label] || {},
    endpointScenario.all || {},
    endpointScenario[sId.viewport.label] || {},
  ];

  const subscenarios = _getSubscenarios(r, sId, scenarios);
  
  const result = {
    label       : sId.label,
    url         : new URL(sId.endpoint, boilerplate.test).toString(),
    referenceUrl: new URL(sId.endpoint, boilerplate.reference).toString(),
    viewports   : [sId.viewport],

    ...merge(scenarios, subscenarios)
  };

  return result;
}


/**
 * Load subsubscenarios from and common.json endpoint's scenairo.
 * @param {Resolver} r Resolver instance
 * @param {ScenarioID} sId ScenarioID instance
 * @param {Array} scenarios be subject to relational senarios
 */
function _getSubscenarios(r, sId, scenarios) {
  return scenarios.map((scenario, i) => _.isArray(scenario[INC_JSON])
    ? scenario[INC_JSON].map(subscenarioName => ({
        name: subscenarioName,
        json: require(i == 0 || i == 1 // for common file
          ? r.cwdBoilerplate(COMMON_DIR, `${subscenarioName}.json`)
          : r.cwdBoilerplate(sId.sanitizedEndpoint, `${subscenarioName}.json`)
        )
      }))

    : []
  );
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
