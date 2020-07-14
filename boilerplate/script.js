const path = require("path");

const { fromRoot, fromBoilerplate } =  require("./resolve");
const backstopEngineScript = fromRoot("backstop_data/engine_scripts/puppet");
const backstop = require(fromRoot("backstop.json"));

const { INC_CODE, WORK_DIR } = require(fromBoilerplate("scenario"));
const { requireSafe } = require(fromBoilerplate("utils"));


const preimplementScripts = {

  clickAndHoverHelper: require(path.join(backstopEngineScript, "clickAndHoverHelper.js")),
  loadCookies        : require(path.join(backstopEngineScript, "loadCookies.js")),
  overrideCSS        : require(path.join(backstopEngineScript, "overrideCSS.js")),

  // optional scripts below.
  // ignoreCSP          : require(path.join(backstopEngineScript, "ignoreCSP.js")), 
  // interceptImages    : require(path.join(backstopEngineScript, "interceptImages.js")),

  setUserAgent: async (page, scenario, vp) => {
    if (scenario.userAgent && 0 < scenario.userAgent.length)
      await page.setUserAgent(scenario.userAgent)
  },
};


/**
 * Use in onBefore fook and onReady fook.
 * dynamically call enginescript belong "$scripts" property in a scenario file.
 * @param {*} ifLabel 
 * @param {*} logLabel 
 */
function createScriptLoader(ifLabel, logLabel) {
  return async (page, scenario, vp) => {
    if (!scenario[INC_CODE] || scenario[INC_CODE].length === 0)
      return;

    const workDir = path.resolve(__dirname, scenario[WORK_DIR]);
    const getUserScripts = await requireSafe(path.join(workDir, `${backstop.engine}_scripts.js`));
    const scripts = getUserScripts(preimplementScripts);

    console.log(`${scenario.label} |  Execute engine scripts in '${logLabel}'`);
    for (let value of scenario[INC_CODE]) {
      const values = value.split(":");

      if (values.shift() !== ifLabel)
        continue;

      const method = values.shift();
      const args = values.map(arg => arg.match(/^[0-9]+$/) ? parseInt(arg): arg);

      console.log(`${scenario.label} |  ${method} ...`);
      await scripts[method](page, scenario, vp, ...args);
    };
  };
}

module.exports = createScriptLoader;
