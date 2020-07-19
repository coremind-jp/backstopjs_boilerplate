const Resolver = require("./boilerplate/resolver");
const { initialize, syncTemplates } = require("./boilerplate/template");
const { createScenarios } = require("./boilerplate/scenario");
const { unlink, createFile } = require("./boilerplate/utils");
const { INMDENT_JSON } = require("./boilerplate/vars");


async function boilerplate(command, path) {

  const resolver = new Resolver(path);

  switch (command) {

    case "init":
      await initialize(resolver);
      break;

    case "sync":
      await syncTemplates(resolver);
      break;

    case "test":
    case "reference":
      const backstop = require(resolver.backstop);

      backstop.scenarios = await createScenarios(resolver, command);

      await unlink(path);

      await createFile(path, JSON.stringify(backstop, null, INMDENT_JSON));
      break;
  }
}

module.exports = boilerplate;
