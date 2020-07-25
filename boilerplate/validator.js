const _ = require("lodash");


function validateConfigure(boilerplate, type = "error") {

  const notify = createNotify(type);

  validateEndpoints(boilerplate, false, notify);

  if ("skip" in boilerplate)
    validateSkip(boilerplate.skip, notify);

  return boilerplate;
}


function validateEndpoints(object, allowEmpty, notify) {

  if (!("endpoints" in object))
    notify(`Undefined endpoints.`);

  if (!_.isPlainObject(object.endpoints))
    notify(`Key "endpoints" must be object.`);

  if (_.keys(object.endpoints).length === 0 && !allowEmpty)
    notify(`Endpoints is empty.`);

  for (const endpoint in object.endpoints) {
    if (endpoint.length === 0)
      notify(`Endpoints key is empty string. ${endpoint}`);

    const endpoints = object.endpoints[endpoint];

    if (!_.isArray(endpoints))
      notify(`Endpoints value must be array. ${endpoint}`);

    endpoints.forEach(scenarioName => {
      if (!_.isString(scenarioName))
        notify(`scenario name must be string. ${endpoint}`);

      if (scenarioName.length === 0)
        notify(`scenario name is empty. ${endpoint}`);
    });
  }  
}


function validateSkip(skip, notify) {

  if (!("when" in skip))
    notify(`Require "when" parameter if using "skip".`);

  if (skip.when !== "test" && skip.when !== "reference")
    notify(`"when" key available value is test or reference only.`);

  validateEndpoints(skip, true, notify);
}


function createNotify(type = "error") {
  return type === "log" ? console.log : (message) => { throw new Error(message); }
}


module.exports = validateConfigure;