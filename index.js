const _ = require("lodash");
const chokidar = require("chokidar");

const R = require("./boilerplate/resolver");
const { initialize, syncTemplates } = require("./boilerplate/template");
const { createScenarios } = require("./boilerplate/scenario");
const { unlink, createFile } = require("./boilerplate/utils");
const { INMDENT_JSON } = require("./boilerplate/vars");


/**
 * @see https://github.com/coremind-jp/backstopjs_boilerplate
 * @param {string} command init | sync | watch | test | reference
 * @param {string} path path to backstop.json
 */
async function boilerplate(command, path) {

  R.initialize(path);

  switch (command) {

    case "init":
      await initialize();
      break;

    case "sync":
      await syncTemplates();
      break;

    case "watch":
      console.log("boilerplate now watching...");

      chokidar.watch(
        [R.boilerplate, R.cwdBoilerplate("**/*.json")],
        {}
      ).on(
        "change",
        _.debounce(() => syncTemplates(), 200, { leading: true, trailing: false }
      ));
      break;

    case "test":
    case "reference":
      const backstop = require(R.backstop);

      backstop.scenarios = await createScenarios(command);

      await unlink(path);

      await createFile(path, JSON.stringify(backstop, null, INMDENT_JSON));
      break;
  }
}

module.exports = boilerplate;

boilerplate("", "backstop.json");