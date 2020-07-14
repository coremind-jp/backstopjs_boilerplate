const path = require("path");

const fromRoot          = file => path.join(path.resolve(process.cwd()), file);
const fromBoilerplate   = file => path.join(path.resolve(__dirname), file);
const fromTemplates     = file => path.join(path.resolve(__dirname), "templates", file);
const fromPuppetScript  = file => path.join(fromRoot("backstop_data/engine_scripts/puppet"), file);

const resolveEntryPoint = relativeConfigPath => {
  const root = path.dirname(path.resolve(relativeConfigPath));
  const config = require(`.\\${path.relative(__dirname, relativeConfigPath)}`);
  const endpointRoot = path.join(root, config.pwd || ".");

  return { root, endpointRoot, config };
};

module.exports = {
  fromRoot,
  fromBoilerplate,
  fromTemplates,
  fromPuppetScript,
  resolveEntryPoint,
};
