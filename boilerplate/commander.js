function validateCommand(value) {
  if (value.match(/(init|sync|test|reference)/))
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

module.exports = (result => {

  require("commander")
    .version(require("../package.json").version)
    .arguments("<command> [config]")
    .action((command, config) => {
      result.command = validateCommand(command);
      result.config = validateConfig(config || "backstop.json");
    })
    .parse(process.argv);

  return result;

})({});