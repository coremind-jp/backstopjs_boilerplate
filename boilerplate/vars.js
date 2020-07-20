/**
 * Config file name for boilerplate.
 */
const BOILERPLATE_CONFIG = "boilerplate.json";


/**
 * Template file name for puppeteer engine script hook.
 */
const PUPPETEER_HOOK = "puppeteer_hook.js";


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
 * Template file name for integraation example.
 */
const INTEGRATION_EXAMPLE = "integration_example.js";


/**
 * Template directory name for common
 */
const COMMON_DIR = "_common";


/**
 * scenario name for empty array endpoint.
 */
const UNDEFINED_SCENARIO = "Undef scenario created by boilerplate";


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
 * Scenario key prefix. (merge and unique)
 */
const MERGE_PREFIX_PLUSE = "+:";


/**
 * Scenario key prefix. (matched remove)
 */
const MERGE_PREFIX_MINUS = "-:";


/**
 * Scenario key prefix. (assign)
 */
const MERGE_PREFIX_EQUAL = "=:";


/**
 * Scenario key prefix regexp.
 */
const MERGE_PREFIX_REGEXP = "^[+\-\=]:";


/**
 * Made json files by boilerplate that number of indent.
 */
const INMDENT_JSON = 4;



module.exports = {
  BOILERPLATE_CONFIG,
  PUPPETEER_HOOK,
  ENDPOINT_SCENARIO,
  COMMON_SCENARIO,
  ENGINE_SCRIPT,
  INTEGRATION_EXAMPLE,
  COMMON_DIR,
  INC_CODE,
  INC_JSON,
  INMDENT_JSON,
  MERGE_PREFIX_PLUSE,
  MERGE_PREFIX_MINUS,
  MERGE_PREFIX_EQUAL,
  MERGE_PREFIX_REGEXP
};
