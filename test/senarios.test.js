const _ = require("lodash");
const { createScenarios } = require("../boilerplate/scenario");

let onBefore, onReady, scenarios;

let def = (() => {
  const config = require("./sample/config.json");
  const keys = _.keys(config.endpoints);

  return {
    viewports: config.viewports,
    numViewports: config.viewports.length,
    numEndpoints: keys.length,
    numScenarios: keys.reduce((n, key) => n += config.endpoints[key].length, 0),
  }
})();


describe("ScenarioTest", () => {

  beforeEach(async () => {
    scenarios = await createScenarios("test/sample/config.json", false);
  });

  describe("Parse Endpoints", () => {

    test(`Scenario each have just one viewpoirt.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.viewports.length)).toHaveLength(1);
    });

    test(`Sample have ${def.numEndpoints} endpoints.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.url)).toHaveLength(def.numEndpoints);
    });

    test(`Sample have ${def.numViewports} viewpoirts.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.viewports[0].label)).toHaveLength(def.numViewports);
    });

    test(`Sample have ${def.numScenarios} unique scenarios.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.label.replace(/(desktop|phone)/, "")))
        .toHaveLength(def.numScenarios);
    });

    test(`Sample have ${def.numScenarios * def.numViewports} scenarios because defined ${def.numScenarios} unique scenarios each ${def.numViewports} viewports`,
      async () => { expect(scenarios).toHaveLength(def.numScenarios * def.numViewports); });
  });


  describe("Define parameters", () => {

    test("Parameter able to define each a viewpoirt in same scenario file", async () => {

      def.viewports.forEach(viewport => {
        expect(scenarios.filter(scenario => scenario.label.match(new RegExp(viewport)))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ __defined_at_common_viewport: viewport })
          ]));
      });
    });

    test("Defined parameter able to delete use a reserved value as '$delete'", async () => {

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_a/)) {
          expect(scenario.__delete_me).toBeUndefined();
        } else {
          expect(scenario.__delete_me).toEqual("some value");
        }
      });
    });
  });


  describe("Include Subscenarios", () => {

    test("Common.json able to include subscenarios each a viewport", async () => {

      scenarios.forEach(scenario => {
        const expected1 = { __defined_at_common_sub_all: "all" };
        const expected2 = { __defined_at_common_sub_viewport: scenario.viewports[0].label };

        expect(scenario).toMatchObject(expected1);
        expect(scenario).toMatchObject(expected2);
      });
    });

    test("Scenarios able to include subscenarios each a viewport from same directory", async () => {

      scenarios.forEach(scenario => {
        const expected1 = { __defined_at_endpoint_sub_all: "all" };
        const expected2 = { __defined_at_endpoint_sub_viewport: scenario.viewports[0].label };

        if (scenario.label.match(/scenario_[a|b]/)) {
          expect(scenario).toMatchObject(expected1);
          expect(scenario).toMatchObject(expected2);
        } else {
          expect(scenario).not.toMatchObject(expected1);
          expect(scenario).not.toMatchObject(expected2);
        }
      });
    });
  });


  describe("Overwrite parameters", () => {

    test("Common.json's subscenario able to overwrite another one that priority decid by '$subScenarios' order", async () => {

      scenarios.forEach(scenario => {
        const expected = { __overwrite_me_with_common_sub: "overwrite_by_common_sub_second" };
        expect(scenario).toMatchObject(expected);
      });
    });

    test("Common.json able to overwrite subscenarios", async () => {

      scenarios.forEach(scenario => {
        const expected = { __overwrite_me_with_common: "overwrite_by_common" };
        expect(scenario).toMatchObject(expected);
      });
    });

    test("Scenario's subscenario able to overwrite common.json and common.json's subscenarios", async () => {

      scenarios.forEach(scenario => {
        const expected = { __overwrite_me_with_endpoint_sub: "overwrite_by_endpoint_sub" };

        if (scenario.label.match(/scenario_[c|d]/)) {
          expect(scenario).toMatchObject(expected);
        } else {
          expect(scenario).not.toMatchObject(expected);
        }
      });
    });

    test("Scenario able to overwrite every defined paramerters", async () => {

      scenarios.forEach(scenario => {
        const expected = { __overwrite_me_with_endpoint: "overwrite_by_endpoint" };

        if (scenario.label.match(/scenario_c/)) {
          expect(scenario).toMatchObject(expected);
        } else {
          expect(scenario).not.toMatchObject(expected);
        }
      });
    });

    test("Defined scenario's parameter have the highest priority", async () => {

      scenarios.forEach(scenario => {
        const expected1 = { __overwrite_me: "overwrite_by_endpoint" };
        const expected2 = { __overwrite_me: "overwrite_by_endpoint_sub" };
        const expected3 = { __overwrite_me: "overwrite_by_common" };

        if (scenario.label.match(/scenario_c/)) {
          expect(scenario).toMatchObject(expected1);
        } else if (scenario.label.match(/scenario_d/)) {
          expect(scenario).toMatchObject(expected2);
        } else {
          expect(scenario).toMatchObject(expected3);
        }
      });
    });
  });


  describe("Merge array parameter", () => {

    test("Defined array parameter able to merge with custom prefix that follow the overwrite's priority rules", async () => {

      const expected1 = [
        "defined_at_common_sub",
        "defined_at_common",
        "defined_at_endpoint_sub",
        "defined_at_endpoint",
        "defined_at_endpoint_with_alias"
      ];

      const expected2 = [
        "defined_at_common_sub",
        "defined_at_common"
      ];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_e/)) {
          expect(scenario.__merge_me).toEqual(expected1)
        } else {
          expect(scenario.__merge_me).toEqual(expected2)
        }
      });
    });

    test("Defined array parameter able to remove with custom prefix that follow the overwrite's priority rules", async () => {

      const expected1 = [];
      const expected2 = ["defined_at_common_sub"];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_e/)) {
          expect(scenario.__remove_me).toEqual(expected1)
        } else {
          expect(scenario.__remove_me).toEqual(expected2)
        }
      });
    });

    test("Defined array parameter able to replace with custom prefix that follow the overwrite's priority rules", async () => {

      const expected1 = ["replaced_by_endpoint"];
      const expected2 = ["defined_at_common_sub"];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_e/)) {
          expect(scenario.__replace_me).toEqual(expected1)
        } else {
          expect(scenario.__replace_me).toEqual(expected2)
        }
      });
    });
  });


  describe("Custom scripts", () => {

    beforeEach(async () => {
      notifyCalled = require("./sample/spy").notifyCalled;
      notifyCalled.mockClear();
      jest.mock("./sample/spy");
    });

    test("Scenario able to call onBefore hook that follow the overwrite's priority rules", async () => {

      onBefore = require("../boilerplate/script")("before", "onBefore");

      for (const scenario of scenarios)
        if (scenario.label.match(/scenario_f/))
          await onBefore(null, scenario, null);
 
      const expected = def.viewports.reduce((result, viewport) => {
        result.push(`CALLED subscenarioScriptBefore FROM /script:scenario_f:${viewport}`);
        result.push(`CALLED scriptA FROM /script:scenario_f:${viewport}`);

        return result;
      }, []);

      expect(notifyCalled.mock.calls.map(call => call[0])).toEqual(expected);
    });

    test("Scenario able to call onReady hook that follow the overwrite's priority rules", async () => {

      onReady = require("../boilerplate/script")("ready", "onReady");

      for (const scenario of scenarios)
        if (scenario.label.match(/scenario_g/))
          await onReady(null, scenario, null);

      const expected = def.viewports.reduce((result, viewport) => {
        result.push(`CALLED subscenarioScriptReady FROM /script:scenario_g:${viewport}`);
        result.push(`CALLED scriptB FROM /script:scenario_g:${viewport}`);

        return result;
      }, []);

      expect(notifyCalled.mock.calls.map(call => call[0])).toEqual(expected);
    });
  });
});