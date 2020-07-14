#!/usr/bin/env node
'use strict'

const _ = require("lodash");
const backstopjs = require("backstopjs");

const { fromRoot, fromBoilerplate } = require("./resolve");
const { createTemplates } = require(fromBoilerplate("template.js"));
const { createScenarios } = require(fromBoilerplate("scenario.js"));

(async function (command, boilerplateConfigPath, filter) {

  switch (command) {

    case "init":
      await backstopjs(command);
      await createTemplates(boilerplateConfigPath);
      break;


    case "test":
    case "reference":
      const config = require(fromRoot("backstop.json"));

      config.scenarios = await createScenarios(boilerplateConfigPath, command === "reference");

      backstopjs(command, { config, filter });
      break;


    default:
      backstopjs(...process.argv);
      break;
  }

})(
  process.argv[2],
  process.argv[3],
  process.argv[4],
);
