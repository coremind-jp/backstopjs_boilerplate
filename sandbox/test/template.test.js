const _ = require("lodash");

const { exists, sanitizeEndpoint } = require("backstopjs_boilerplate/boilerplate/utils");
const vars = require("backstopjs_boilerplate/boilerplate/vars");
const R = require("backstopjs_boilerplate/boilerplate//resolver");

R.initialize("backstop.json");
const backstop = require(R.backstop);
const boilerplate = require(R.boilerplate);

describe("Exists files and directories.", () => {

  describe("When after 'init'", () => {
    [
      R.cwdBoilerplate(),
      R.cwdBoilerplate(vars.BOILERPLATE_CONFIG),
      R.cwdBoilerplate(`${backstop.engine}_scripts.js`),
      R.cwdPuppetScript("onBefore.js.backup"),
      R.cwdPuppetScript("onReady.js.backup"),
      R.cwdPuppetScript(vars.PUPPETEER_HOOK)
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    })
  });


  describe("When after 'sync'", () => {
    [
      R.cwdBoilerplate(vars.COMMON_DIR),
      R.cwdBoilerplate(vars.COMMON_DIR, vars.COMMON_SCENARIO),
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    })
    
    for (const endpoint in boilerplate.endpoints) {
      const sanitized = sanitizeEndpoint(endpoint);

      boilerplate.endpoints[endpoint].forEach(scenarioName =>
        test(`Exists ${R.cwdBoilerplate(sanitized, `${scenarioName}.json`)}`, async () =>
          expect(await exists(R.cwdBoilerplate(sanitized, `${scenarioName}.json`))).toBe(true)
        )
      );
    }
  });
});