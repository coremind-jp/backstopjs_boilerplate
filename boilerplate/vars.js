/**
 * Config file name for boilerplate.
 */
const CONF_FILE_NAME = "boilerplate.json";


/**
 * Template file name for puppeteer engine script hook.
 */
const PUPPETEER_HOOK = "puppeteer_hook.json";


/**
 * Template file name for common scenario
 */
const COMMON_SCENARIO = "common.json";


/**
 * Template file name for endpoint scenario
 */
const ENDPOINT_SCENARIO = "endpoint.json";


/**
 * Template file name for engine scripts
 */
const ENGINE_SCRIPT = "engine_scripts.js";


/**
 * Template directory name for common
 */
const COMMON_DIR = "_common";


/**
 * Scenario key
 * that execute scripts when process in onBefore or onReady.
 */
const INC_CODE = "$scripts";


/**
 * Scenario key
 * that load the scenario before include subscenario files.
 */
const INC_JSON = "$subscenarios";


/**
 * Made json files by boilerplate that number of indent.
 */
const INMDENT_JSON = 4;



module.exports = {
  CONF_FILE_NAME,
  PUPPETEER_HOOK,
  ENDPOINT_SCENARIO,
  COMMON_SCENARIO,
  ENGINE_SCRIPT,
  COMMON_DIR,
  INC_CODE,
  INC_JSON,
  INMDENT_JSON,
};
