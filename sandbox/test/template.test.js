const _ = require("lodash");

const { exists, sanitizeEndpoint, mkdir, createFile } = require("backstopjs_boilerplate/boilerplate/utils");
const { syncTemplates } = require("backstopjs_boilerplate/boilerplate/template");
const vars = require("backstopjs_boilerplate/boilerplate/vars");
const R = require("backstopjs_boilerplate/boilerplate/resolver");

R.initialize("backstop.json");
const backstop = require(R.backstop);
const boilerplate = require(R.boilerplate);

describe("Feature Template Generation.", () => {

  describe("Should exist files / directories when after 'init'", () => {
    [
      R.joinCwd(vars.INTEGRATION_EXAMPLE),
      R.cwdBoilerplate(),
      R.cwdBoilerplate(vars.BOILERPLATE_CONFIG),
      R.cwdBoilerplate(`${backstop.engine}_scripts.js`),
      R.cwdBoilerplate(vars.TEMPLATE_ENDPOINT),
      R.cwdBoilerplate(vars.TEMPLATE_SUBSCENARIO),
      R.cwdPuppetScript(vars.PUPPETEER_HOOK),
      R.cwdPuppetScript("onBefore.js.backup"),
      R.cwdPuppetScript("onReady.js.backup"),
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    })
  });


  describe("Should exist files / directories when after 'sync'", () => {
    [
      R.cwdBoilerplate(vars.COMMON_DIR),
      R.cwdBoilerplate(vars.COMMON_DIR, vars.TEMPLATE_COMMON),
    ].forEach(path => {
      test(`Exists ${path}`, async () => expect(await exists(path)).toBe(true));
    });

    for (const endpoint in boilerplate.endpoints) {
      const sanitized = sanitizeEndpoint(endpoint);

      boilerplate.endpoints[endpoint].forEach(scenarioName =>
        test(`Exists ${R.cwdBoilerplate(sanitized, `${scenarioName}.json`)}`, async () =>
          expect(await exists(R.cwdBoilerplate(sanitized, `${scenarioName}.json`))).toBe(true)
        )
      );
    }
  });


  describe("Sync command (syncTemplates)", () => {

    test(`Remove irrelevant directories`, async () => {
      const paths = [
        R.cwdBoilerplate("irrelevant_dir_1"),
        R.cwdBoilerplate("irrelevant_dir_2")
      ];

      for (const path of paths) {
        await mkdir(path);

        expect(await exists(path)).toBe(true);

        await syncTemplates();

        expect(await exists(path)).toBe(false);
      }
    });

    test(`Remove irrelevant files`, async () => {
      const paths = [
        R.cwdBoilerplate(vars.COMMON_DIR, "irrelevant_file_1"),
        R.cwdBoilerplate(vars.COMMON_DIR, "irrelevant_file_2")
      ];

      for (const path of paths) {
        await createFile(path, "dummy data");

        expect(await exists(path)).toBe(true);

        await syncTemplates();

        expect(await exists(path)).toBe(false);
      }
    });

    test(`Auto generate scenrio file with template_endpoint.json`, async () => {

      const endopointName = "some_endpoint";
      const endpointDirPath = R.cwdBoilerplate(endopointName);

      const scenarioName = "some_endpoint_scenario";
      const scenarioPath = R.cwdBoilerplate(endopointName, `${scenarioName}.json`);

      expect(await exists(endpointDirPath)).toBe(false);
      expect(await exists(scenarioPath)).toBe(false);

      const boilerplateClone = _.cloneDeep(boilerplate);
      boilerplateClone.endpoints[endopointName] = [scenarioName];

      await createFile(R.boilerplate, JSON.stringify(boilerplateClone), true);
      await syncTemplates(boilerplateClone);

      expect(await exists(endpointDirPath)).toBe(true);
      expect(await exists(scenarioPath)).toBe(true);

      const template = require(R.cwdBoilerplate(vars.TEMPLATE_ENDPOINT));
      const generated = require(scenarioPath);
      const expected = backstop.viewports.reduce((expected, viewport) => {
        expected[viewport.label] = template;
        return expected;
      }, {});

      expect(generated).toMatchObject(expected);
    });

    test(`Auto generate subscenrio file with template_subscenario.json`, async () => {

      const commonPath = R.cwdBoilerplate(vars.COMMON_DIR, vars.TEMPLATE_COMMON);
      const common = require(commonPath);

      const subscenarioName = "dummy_subscenario";
      const subscenarioPath = R.cwdBoilerplate(vars.COMMON_DIR, `${subscenarioName}.json`);

      common.all[vars.INC_JSON] = [subscenarioName];

      expect(await exists(subscenarioPath)).toBe(false);

      await createFile(commonPath, JSON.stringify(common), true);
      await syncTemplates();

      expect(await exists(subscenarioPath)).toBe(true);

      const generated = require(subscenarioPath);
      const expected = require(R.cwdBoilerplate(vars.TEMPLATE_SUBSCENARIO));

      expect(generated).toMatchObject(expected);
    });
  });
});