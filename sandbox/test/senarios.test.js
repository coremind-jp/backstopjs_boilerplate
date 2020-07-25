const _ = require("lodash");

const { createScenarios } = require("backstopjs_boilerplate/boilerplate/scenario");
const { UNDEFINED_SCENARIO } = require("backstopjs_boilerplate/boilerplate/vars");
const R = require("backstopjs_boilerplate/boilerplate/resolver");

R.initialize("backstop.json");
const backstop = require(R.backstop);
const boilerplate = require(R.boilerplate);

let onBefore, onReady, scenarios;

let def = (() => {
  const keys = _.keys(boilerplate.endpoints);

  return {
    viewports: backstop.viewports,
    numViewports: backstop.viewports.length,
    numEndpoints: keys.length,
    numScenarios: keys.reduce((n, key) =>
      n += (boilerplate.endpoints[key].length || 1), 0),
  }
})();


describe("ScenarioTest", () => {

  beforeEach(async () => {
    scenarios = createScenarios();
  });

  describe("Parse Endpoints", () => {

    test(`Scenario has each just one viewpoirt.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.viewports.length)).toHaveLength(1);
    });

    test(`Sample has ${def.numEndpoints} endpoints.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.url)).toHaveLength(def.numEndpoints);
    });

    test(`Sample has ${def.numViewports} viewpoirts.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.viewports[0].label)).toHaveLength(def.numViewports);
    });

    test(`Sample has ${def.numScenarios} unique scenarios.`, async () => {
      expect(_.uniqBy(scenarios, scenario => scenario.label.replace(/(tablet|phone)/, "")))
        .toHaveLength(def.numScenarios);
    });

    test(`Sample has ${def.numScenarios * def.numViewports} scenarios because defined ${def.numScenarios} unique scenarios each ${def.numViewports} viewports`,
      async () => { expect(scenarios).toHaveLength(def.numScenarios * def.numViewports); });
  });


  describe("Define parameters", () => {

    test("Parameter able to define each a viewpoirt in same scenario file", async () => {

      def.viewports.forEach(viewport => {
        expect(scenarios.filter(scenario => scenario.label.match(new RegExp(viewport.label)))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ __defined_at_common_viewport: viewport.label })
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

    test("Create a scenario automatically if not exists scenarios in endpoint'", async () => {

      def.viewports.forEach(viewport => {
        expect(scenarios.filter(scenario => scenario.label.match(new RegExp(viewport.label)))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ label: `/not_exists_scenario_file:${UNDEFINED_SCENARIO}:${viewport.label}` })
          ]));
      });
    });

  });

  describe("Skip Scenario creation.", () => {

    test("The boilerplate.json will skip creation a scenario if same scenario in skip block endpoints.'", async () => {

      def.viewports.forEach(viewport => {
        expect(scenarios.filter(scenario => scenario.label.match(new RegExp(viewport.label)))).toEqual(
          expect.arrayContaining([
            expect.not.objectContaining({ label: `/skip_scenario:skip_a:${viewport.label}` })
          ]));
      });
    });

    test("The boilerplate.json will skip creation all scenarios in a endpoint if not exists scenarios in skip block endpoint", async () => {

      def.viewports.forEach(viewport => {
        expect(scenarios.filter(scenario => scenario.label.match(new RegExp(viewport.label)))).toEqual(
          expect.arrayContaining([
            expect.not.objectContaining({ label: `/skip_exists_scenario_files:skip_scenario_b:${viewport.label}` }),
            expect.not.objectContaining({ label: `/skip_exists_scenario_files:skip_scenario_d:${viewport.label}` }),
            expect.not.objectContaining({ label: `/skip_exists_scenario_files:skip_scenario_c:${viewport.label}` }),
            expect.not.objectContaining({ label: `/skip_not_exists_scenario_file:${UNDEFINED_SCENARIO}:${viewport.label}` })
          ]));
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

    test("Common.json's subscenario able to overwrite another one that priority decid by '$subscenarios' order", async () => {

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
        "defined_at_endpoint_with_alias",
      ];

      const expected2 = [
        "defined_at_common_sub",
        "defined_at_common",
        "defined_at_endpoint_sub",
      ];

      const expected3 = [
        "defined_at_common_sub",
        "defined_at_common"
      ];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_e/)) {
          expect(scenario.__merge_me).toEqual(expected1)
        } else if (scenario.label.match(/scenario_h/)) {
          expect(scenario.__merge_me).toEqual(expected2)
        } else {
          expect(scenario.__merge_me).toEqual(expected3)
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

    test("Custom prefix '-:' the lowest priority in prefixes", async () => {

      const expected = ["a", "b", "c", "d", "aa", "bb", "cc", "dd"];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_h/)) {
          expect(scenario.__merge_order_remove_before).toEqual(expected)
          expect(scenario.__merge_order_remove_after).toEqual(expected)
        }
      });
    });

    test("Custom prefix '=:' the highest priority in prefixes", async () => {

      const expected = ["set", "prefix", "the", "highest", "priority"];

      scenarios.forEach(scenario => {
        if (scenario.label.match(/scenario_h/)) {
          expect(scenario.__merge_order_set_the_highest_priority).toEqual(expected)
        }
      });
    });
  });


  describe("Custom scripts", () => {

    beforeEach(async () => {
      notifyCalled = require("../backstop_data/boilerplate/spy").notifyCalled;
      notifyCalled.mockClear();
      jest.mock("../backstop_data/boilerplate/spy");
    });

    test("Scenario able to call onBefore hook that follow the overwrite's priority rules", async () => {

      onBefore = require("../backstop_data/engine_scripts/puppet/puppeteer_hook")("before", "onBefore");

      for (const scenario of scenarios)
        if (scenario.label.match(/scenario_f/))
          await onBefore(null, scenario, null);
 
      const expected = def.viewports.reduce((result, viewport) => {
        result.push(`CALLED subscenarioScriptBefore FROM /script:scenario_f:${viewport.label}`);
        result.push(`CALLED scriptA FROM /script:scenario_f:${viewport.label}`);

        return result;
      }, []);

      expect(notifyCalled.mock.calls.map(call => call[0])).toEqual(expected);
    });

    test("Scenario able to call onReady hook that follow the overwrite's priority rules", async () => {

      onReady = require("../backstop_data/engine_scripts/puppet/puppeteer_hook")("ready", "onReady");

      for (const scenario of scenarios)
        if (scenario.label.match(/scenario_g/))
          await onReady(null, scenario, null);

      const expected = def.viewports.reduce((result, viewport) => {
        result.push(`CALLED subscenarioScriptReady FROM /script:scenario_g:${viewport.label}`);
        result.push(`CALLED scriptB FROM /script:scenario_g:${viewport.label}`);

        return result;
      }, []);

      expect(notifyCalled.mock.calls.map(call => call[0])).toEqual(expected);
    });
  });
});