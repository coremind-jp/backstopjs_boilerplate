const { INC_CODE } = require("backstopjs_boilerplate/boilerplate/vars");

const getUserScripts = require(`../../boilerplate/puppeteer_scripts.js`);


const preimplementScripts = {

  clickAndHoverHelper: require("./clickAndHoverHelper.js"),
  loadCookies        : require("./loadCookies.js"),
  overrideCSS        : require("./overrideCSS.js"),
  // ignoreCSP          : require("./ignoreCSP.js"), 
  // interceptImages    : require("./interceptImages.js"),

  setUserAgent: async (page, scenario) => {
    if (scenario.userAgent && 0 < scenario.userAgent.length)
      await page.setUserAgent(scenario.userAgent)
  },
};


/**
 * Use in onBefore fook and onReady fook.
 * dynamically call engine scripts belong "$scripts" property in a scenario file.
 * @param {string} prefix before or ready 
 * @param {string} logLabel use console.log
 */
function createScriptLoader(prefix, logLabel) {
  return async (...backstopArgments) => {
    const scenario = backstopArgments[1];

    if (!scenario[INC_CODE] || scenario[INC_CODE].length === 0)
      return;

    const scripts = getUserScripts(preimplementScripts);

    console.log(`${scenario.label} |  Execute engine scripts in '${logLabel}'`);
    for (let value of scenario[INC_CODE]) {
      const values = value.split(":");

      if (values.shift() !== prefix)
        continue;

      const method = values.shift();
      const args = values.map(arg => arg.match(/^[0-9]+$/) ? parseInt(arg): arg);

      console.log(`${scenario.label} |  ${method} ...`);
      await scripts[method](...backstopArgments, ...args);
    };
  };
}

module.exports = createScriptLoader;
