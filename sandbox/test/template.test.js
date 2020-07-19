const _ = require("lodash");

const { exists, sanitizeEndpoint } = require("backstopjs_boilerplate/boilerplate/utils");
const vars = require("backstopjs_boilerplate/boilerplate/vars");
const Resolver = require("backstopjs_boilerplate/boilerplate/resolver");

const r = new Resolver("backstop.json");
const backstop = require(r.backstop);
const boilerplate = require(r.boilerplate);

describe("Exists files and directories.", () => {

  beforeEach(async () => {
  });

  describe("When after 'init'", () => {
    [
      r.cwdBoilerplate(),
      r.cwdBoilerplate(vars.BOILERPLATE_CONFIG),
      r.cwdBoilerplate(`${backstop.engine}_scripts.js`),
      r.cwdPuppetScript("onBefore.js.backup"),
      r.cwdPuppetScript("onReady.js.backup"),
      r.cwdPuppetScript(vars.PUPPETEER_HOOK)
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    })
  });


  describe("When after 'sync'", () => {
    [
      r.cwdBoilerplate(vars.COMMON_DIR),
      r.cwdBoilerplate(vars.COMMON_DIR, vars.COMMON_SCENARIO),
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    })
    
    for (const endpoint in boilerplate.endpoints) {
      const sanitized = sanitizeEndpoint(endpoint);

      boilerplate.endpoints[endpoint].forEach(scenarioName =>
        test(`Exists ${r.cwdBoilerplate(sanitized, `${scenarioName}.json`)}`, async () =>
          expect(await exists(r.cwdBoilerplate(sanitized, `${scenarioName}.json`))).toBe(true)
        )
      );
    }
  });
});