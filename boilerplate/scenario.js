const _ = require("lodash");
const { requireSafe } = require("./utils");
const { resolveEntryPoint, fromBoilerplate } = require("./resolve");
const { ScenarioLabelParser } = require(fromBoilerplate("utils.js"));

/**
 * Property name in scenario(json)
 * that working directory path.
 */
const WORK_DIR = "$__path";

/**
 * Property name in scenario(json)
 * that execute scripts when process in onBefore or onReady.
 */
const INC_CODE = "$scripts";


/**
 * Property name in scenario(json)
 * that load the scenario before include different some scenario.
 */
const INC_JSON = "$subScenarios";


/**
 * Create all scenarios.
 * @param {*} boilerplateConfigPath a path for boilerplate config file from command line.
 * @param {*} isReference true if reference mode.
 */
async function createScenarios(boilerplateConfigPath, isReference) {
  const { root, endpointRoot, config } = resolveEntryPoint(boilerplateConfigPath);

  // defined scenarios as 'skipOnReference' in configfile
  // will be skip when reference command execute.
  if (isReference && config.skipOnReference)
    for (const skipEndpoint in config.skipOnReference)
      config.endpoints[skipEndpoint] = _.differenceWith(
        config.endpoints[skipEndpoint] || [],
        config.skipOnReference[skipEndpoint],
        _.isEqual
      );
  
  let result = [];
  // create scenario each endpoints, scenarios and viewports.
  for (const endpoint in config.endpoints)
    for (const scenarioName of config.endpoints[endpoint])
      for (const vpLabel of config.viewports)
        result = result.concat(
          await createScenario(
            new ScenarioLabelParser(endpoint, scenarioName, vpLabel, endpointRoot),
            config,
            root
          )
        );

  return result;
}


/**
 * Create a scenario for backstopjs config.
 * @param {ScenarioLabelParser} slp be subject to endpoint
 * @param {object} config
 */
async function createScenario(slp, config, root) {

  const commonScenario = await requireSafe(slp.createEndpointsFilePath("common.json"));

  const endpointScenario = await requireSafe(slp.createScenarioFilePath());

  const scenarios = [
    commonScenario.all || {},
    commonScenario[slp.vpLabel] || {},
    endpointScenario.all || {},
    endpointScenario[slp.vpLabel] || {},
  ];

  const subScenarios = await getSubScenarios(slp, scenarios);

  const result = {
    label       : slp.label,
    url         : slp.getUrl(config.test),
    referenceUrl: slp.getUrl(config.reference),

    ...await merge(scenarios, subScenarios)
  };

  result[WORK_DIR] = root;

  return result;
}


/**
 * Load all subScenarios from relational scenairos.
 * @param {ScenarioLabelParser} slp be subject to endpoint
 * @param {Array} scenarios be subject to relational senarios
 */
async function getSubScenarios(slp, scenarios) {
  return Promise.all(scenarios.map((scenario, i) => new Promise(async resolve => resolve(

      await _.isArray(scenario[INC_JSON])
        ? Promise.all(scenario[INC_JSON].map(subScenarioName => new Promise(async innreResolve =>
            innreResolve({
              name: subScenarioName,
              json: await requireSafe(i == 0 || i == 1 // for common file
                ? slp.createEndpointsFilePath(`${subScenarioName}.json`)
                : slp.createScenarioFilePath(`${subScenarioName}.json`)
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
 * @param {Array} subScenarios 
 */
function merge(scenarios, subScenarios) {
  return scenarios.reduce((output, scenario, i) => {

    const mergedSubScenario = {};

    subScenarios[i].forEach(subScenario =>
      _mergeProperties(mergedSubScenario, _.cloneDeep(subScenario.json))
    );

    _mergeProperties(output, mergedSubScenario);
    _mergeProperties(output, _.cloneDeep(scenario));

    return output;

  }, {});
}


/**
 * Merge properties of "from object" to "to object"
 * Able to use custom prefix (-:, +:, =:) each properties.
 * The custom prefix works only Array. 
 * prefix [-:key] remove values from already defined in scenario when equal this property values.
 * prefix [+:key] merge values. (same no prefix case)
 * prefix [=:key] replace variable reference
 * @param {obejct} to merge to
 * @param {obejct} from merge from
 */
function _mergeProperties(to, from) {
  for (const key in from) {

    const value = from[key];
    const clean = { value, key: key.replace(/^[=\-\+]:/, "") };

    delete from[key];

    _.isArray(clean.value)
      ? mergeArray(to, key, clean)
      : _.isObject(clean.value)
        ? mergeObject(to, from, key, clean)
        : mergePrimitive(to, clean);
  }  
}


/**
 * 
 * @param {*} to 
 * @param {*} key 
 * @param {*} clean 
 */
function mergeArray(to, key, clean) {
    if (key.match(/^=:/)) {
      to[clean.key] = clean.value;

    } else if (key.match(/^-:/)) {
      if (_.isArray(to[clean.key])) {
        to[clean.key] = _.differenceWith(to[clean.key], clean.value, _.isEqual);
      }

    } else {
      to[clean.key] = _.uniqWith((to[clean.key] || []).concat(clean.value), _.isEqual);
    }
}


/**
 * 
 * @param {*} to 
 * @param {*} from 
 * @param {*} key 
 * @param {*} clean 
 */
function mergeObject(to, from, key, clean) {
  console.warning("object merge is not suport.");
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

module.exports = {
  WORK_DIR,
  INC_CODE,
  INC_JSON,
  createScenarios,

  test: {
    createScenario,
  }
};
