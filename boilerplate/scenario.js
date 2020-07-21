const URL = require("url").URL;
const _ = require("lodash");

const { sanitizeEndpoint } = require("./utils");
const { INC_JSON, COMMON_DIR, COMMON_SCENARIO, UNDEFINED_SCENARIO,
  MERGE_PREFIX_PLUSE, MERGE_PREFIX_MINUS, MERGE_PREFIX_EQUAL, MERGE_PREFIX_REGEXP
 } = require("./vars");


/**
 * Create scenario each endpoints, scenarios and viewports.
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
        result = result.concat(_createScenario(
          boilerplate,
          r,
          new ScenarioID(endpoint, scenarioName, viewport)
        ));

  return result;
}


/**
 * Push alias as default scenarioa for empty array endpoints.
 * @param {object} boilerplate config for boilerplate
 */
function _pushAlias(boilerplate) {

  for (const endpoint in boilerplate.endpoints)
    if (boilerplate.endpoints[endpoint].length === 0)
      boilerplate.endpoints[endpoint].push(UNDEFINED_SCENARIO);
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
 * Create a scenario.
 * @param {object} boilerplate config for boilerplate
 * @param {Resolver} r Resolver instance
 * @param {ScenarioID} sId ScenarioID instance
 */
function _createScenario(boilerplate, r, sId) {

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
 * Require subsubscenarios from common.json and endpoint's scenairo.
 * @param {Resolver} r 
 * @param {ScenarioID} sId 
 * @param {array} scenarios 
 */
function _getSubscenarios(r, sId, scenarios) {

  return scenarios.map((scenario, i) => _.isArray(scenario[INC_JSON])

    ? scenario[INC_JSON].map(subscenarioName => (require(
          r.cwdBoilerplate(i == 0 || i == 1
            ? COMMON_DIR
            : sId.sanitizedEndpoint, `${subscenarioName}.json`)
        )))

    : []
  );
}


/**
 * Merge scenarios. below order.
 * 1. subscenarios in common.all (the lowest)
 * 2. common.all
 * 3. subscenarios in common.[viewport label]
 * 4. common.[viewport label]
 * 5. subscenarios in endpoint.all
 * 6. endpoint.all
 * 7. subscenarios in endpoint.[viewport label]
 * 8. endpoint.[viewport label] (the highest)
 * 
 * note: subscenario's order ascend with index.
 * @param {array} scenarios 
 * @param {array} subscenarios 
 */
function merge(scenarios, subscenarios) {

  return scenarios.reduce((output, scenario, i) => {

    const mergedSubScenario = {};

    subscenarios[i].forEach(subscenario =>
      _mergeProperties(mergedSubScenario, _.cloneDeep(subscenario))
    );

    _mergeProperties(output, mergedSubScenario);
    _mergeProperties(output, _.cloneDeep(scenario));

    return output;

  }, {});
}


/**
 * Merge properties.
 * If property value is array, available custom prefix (-:, +:, =:) each properties.
 * prefix [-:key] remove values from already defined key in object when same property values.
 * prefix [+:key] merge values and remove duplication values. (default when undefined custom prefix)
 * prefix [=:key] simplly overwirte reference
 * @param {obejct} to 
 * @param {obejct} from 
 */
function _mergeProperties(to, from) {

  const argsList = {
    [MERGE_PREFIX_MINUS]: [],
    [MERGE_PREFIX_PLUSE]: [],
    [MERGE_PREFIX_EQUAL]: [],
  };

  for (const key in from) {

    const value = from[key];
    delete from[key];

    const prefixRegexp = new RegExp(MERGE_PREFIX_REGEXP).exec(key);

    const parsed = prefixRegexp
      ? { value, key: key.replace(prefixRegexp[0], ""), prefix: prefixRegexp[0] }
      : { value, key };

    _.isArray(parsed.value)
      ? argsList[parsed.prefix || MERGE_PREFIX_PLUSE].push([to, parsed])
      : mergePrimitive(to, parsed);
  }

  mergeArray(argsList);
}


/**
 * Merge values for array.
 * @param {array} argsList argments list each prefix group
 */
function mergeArray(argsList) {

  const functions = {
    [MERGE_PREFIX_MINUS]: (to, parsed) =>
      _.isArray(to[parsed.key])
        ? to[parsed.key] = _.differenceWith(to[parsed.key], parsed.value, _.isEqual)
        : console.log(`scenario property "${parsed.key}" variable type was different.`),

    [MERGE_PREFIX_PLUSE]: (to, parsed) =>
      to[parsed.key] = _.uniqWith((to[parsed.key] || []).concat(parsed.value), _.isEqual),

    [MERGE_PREFIX_EQUAL]: (to, parsed) =>
      to[parsed.key] = parsed.value,
  };

  [
    MERGE_PREFIX_MINUS,
    MERGE_PREFIX_PLUSE,
    MERGE_PREFIX_EQUAL
  ].forEach(prefix => argsList[prefix].forEach(args => functions[prefix](...args)));
}


/**
 * Merge value for primitive.
 * @param {*} to 
 * @param {object} parsed 
 */
function mergePrimitive(to, parsed) {
  parsed.value === "$delete" ? delete to[parsed.key] : to[parsed.key] = parsed.value;
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
