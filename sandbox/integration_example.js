#!/usr/bin/env node
'use strict'

try { var backstop = require("backstopjs"); }
catch(e) { throw new Error("you must be install backstopjs.") }

const boilerplate = require("backstopjs_boilerplate");
const cmd = process.argv[2];
const cnf = process.argv[3] || require("path").join(process.cwd(), "backstop.json");

switch (cmd) {
  case "init":
    backstop(cmd).then(() => boilerplate(cmd, cnf));
    break;

  case "sync":
    boilerplate(cmd, cnf);
    break;

  case "test":
  case "reference":
    boilerplate(cmd, cnf).then(() => backstop(cmd, { config: require(cnf) }));
    break;
}
