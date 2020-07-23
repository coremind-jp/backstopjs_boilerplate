#!/usr/bin/env node
'use strict'

function validateCommand(value) {
  if (value.match(/(init|sync|watch|test|reference)/))
    return value;

  throw new Error(`Unknown command "${value}"`);
};

function validateConfig(config) {
  const path = require("path");

  try { require(path.join(process.cwd(), config));
    return config;
  } catch (e) {
    throw new Error(`"${config}" is not found. `);
  }
};

require("commander")
  .version(require("../package.json").version)
  .arguments("<command> [config]")
  .action(async (command, config) => {
    await require("../")(
      validateCommand(command),
      validateConfig(config || "backstop.json")
    );
  })
  .parse(process.argv);
