const _ = require("lodash");
const path = require("path");

const { fromRoot, fromPuppetScript, fromTemplates, resolveEntryPoint, resolveScriptModule } = require("./resolve");
const { mkdir, copyFile, createFile, unlink, ScenarioLabelParser } = require("./utils");


/**
 * Create scenario files and endpoint directories along the boilerplate rules.
 * if already exist files or directories do nothing.
 */
async function createTemplates(boilerplateConfigPath) {

  const backstop = require(fromRoot("backstop.json"));
  const { config, root, endpointRoot } = resolveEntryPoint(boilerplateConfigPath);

  await swapHook("before", "onBefore");
  await swapHook("ready", "onReady");

  await mkdir(endpointRoot);
  await createCommonScenario(path.join(endpointRoot, "common.json"), config);
  await copyFile(fromTemplates("engine_scripts.js"), path.join(root, `${backstop.engine}_scripts.js`));

  for (const endpoint in config.endpoints) {
    const slp = new ScenarioLabelParser(endpoint, undefined, undefined, endpointRoot);
    await mkdir(path.dirname(slp.createScenarioFilePath()));

    config.endpoints[endpoint].forEach(scenarioName => 
      createEndpointScenario(slp.createScenarioFilePath(`${scenarioName}.json`), config)
    );
  }
};


async function swapHook(prefix, file) {
  // commentout because backstopjs always overwriting backstop.json and backstop_data when execute 'init'.
  // if (await exsists(fromPuppetScript(`${file}.js.backup`)))
  //   return;
  
  console.log(`[${file}.js] backup`);
  await copyFile(fromPuppetScript(`${file}.js`), fromPuppetScript(`${file}.js.backup`));

  await unlink(fromPuppetScript(`${file}.js`));

  const data = `module.exports = require("${resolveScriptModule()}/script.js")("${prefix}", "${file}")`
  await createFile(fromPuppetScript(`${file}.js`), data);
  console.log(`[${file}.js] recreated`);
};


async function createEndpointScenario(path, config) {
  const template = require(fromTemplates("scenarioEndpoint.json"));
  let reslult = {};

  for (const vpLabel of config.viewports)
    reslult[vpLabel] = template[config.templateType] || template.max;

  await createFile(path, JSON.stringify(reslult, null, 4));
}


async function createCommonScenario(path, config) {
  const template = require(fromTemplates("scenarioCommon.json"));

  for (const vpLabel of config.viewports)
    template[vpLabel] = {
        userAgent: "",
        viewports: [{ label: vpLabel, width: 1024, height: 768 }]
    };

  await createFile(path, JSON.stringify(template, null, 4));
}

module.exports = {
  createTemplates
};