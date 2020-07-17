#!/usr/bin/env node
'use strict'

const commander = require("./commander");
const { unlink, createFile } = require("./utils");
const { getBackstopConfigPath, getBoilerplateConfigPath } = require("./resolve");
const { initialize, syncTemplates } = require("./template");

const backstopPath = getBackstopConfigPath();
const backstop = require(backstopPath);

switch (commander.command) {

  case "init":
    initialize();
    break;

  case "sync":
    syncTemplates(require(getBoilerplateConfigPath()));
    break;

  case "test":
  case "reference":
    (async () => {
      backstop.scenarios = await require("./scenario.js").createScenarios(commander.command);

      await unlink(backstopPath);

      await createFile(backstopPath, JSON.stringify(backstop, null, 4));
    })();
    break;
}
