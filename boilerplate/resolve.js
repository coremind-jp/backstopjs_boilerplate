const path = require("path");

const { CONF_FILE_NAME } = require("./vars");

const commander = require("./commander");


const getBackstopConfigPath = () => path.resolve(process.cwd(), commander.config);
const getBoilerplateConfigPath = () => cwdBoilerplate(CONF_FILE_NAME);

const pkgBoilerplate = file => path.join(path.resolve(__dirname), file);
const pkgTemplates = file => path.join(path.resolve(__dirname), "templates", file);

const fromRoot = (...values) => path.join(
  path.dirname(path.resolve(process.cwd(), commander.config)),
  ...0 < values.length ? values: [""]
);

const cwdBoilerplate = (...values) => fromRoot(
  "backstop_data/boilerplate",
  ...0 < values.length ? values: [""]
);

const cwdPuppetScript = (...values) => {
  return fromRoot(
    require(getBackstopConfigPath()).paths.engine_scripts,
    "puppet",
    ...0 < values.length ? values: [""]
  )
};


module.exports = {
  CONF_FILE_NAME,

  getBackstopConfigPath,
  getBoilerplateConfigPath,

  pkgBoilerplate,
  pkgTemplates,

  cwdBoilerplate,
  cwdPuppetScript,

  test: {
    fromRoot,
  }
};
