#!/usr/bin/env node
'use strict'

const commander = require("./commander");
const { unlink, createFile } = require("./utils");
const { getBackstopConfigPath, getBoilerplateConfigPath } = require("./resolve");
const { initialize, syncTemplates } = require("./template");
const { createScenarios } = require("./scenario.js");


const backstopPath = getBackstopConfigPath();
const backstop = require(backstopPath);

const boilerplatePath = getBoilerplateConfigPath();
const boilerplate = require(boilerplatePath);

switch (commander.command) {

  case "init":
    initialize();
    break;

  case "sync":
    syncTemplates(boilerplate);
    break;

  case "test":
  case "reference":
    (async () => {
      backstop.scenarios = await createScenarios(commander.command);

      await unlink(backstopPath);

      await createFile(backstopPath, JSON.stringify(backstop, null, 4));
    })();
    break;
}
