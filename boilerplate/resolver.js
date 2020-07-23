const path = require("path");

class Resolver {

  /**
   * Return path to backstop.json
   */
  get backstop() {
    return this._backstop;
  }
  
  /**
   * Return path to boilerplate.json
   */
  get boilerplate() {
    return this._boilerplate;
  }

  initialize(backstop) {
    this._backstop = path.resolve(process.cwd(), backstop);

    this._cwd = path.dirname(this._backstop);

    this._boilerplate = this.cwdBoilerplate(require("./vars").BOILERPLATE_CONFIG);

    return this;
  }

  /**
   * Return path to some file under the "backstop_data/boilerplate".
   * @param {string} values sub directory or file
   */
  cwdBoilerplate(...values) {
    return this.joinCwd(
      "backstop_data/boilerplate",
      ...values
    );
  }

  /**
   * Return path to some file under the "backstop_data/engine_scripts/puppet".
   * @param {string} values sub directory or file
   */
  cwdPuppetScript(...values) {
    return this.joinCwd(
      "backstop_data/engine_scripts/puppet",
      ...values
    );
  }

  /**
   * Return path to some file under the "boilerplate/templates".
   * @param {string} values sub directory or file
   */
  template(...values) {
    if (values.length === 0) values[0] = "";
    return path.join(path.resolve(__dirname), "templates", ...values);
  }

  /**
   * Return path to some file under the current working directory.
   * @param {string} values sub directory or file
   */
  joinCwd(...values) {
    return 0 < values.length
      ? path.join(this._cwd, ...values)
      : this._cwdPath;
  }
}

module.exports = new Resolver();
