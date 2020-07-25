describe("Feature Configure validation.", () => {
  const validateConfigure = require("backstopjs_boilerplate/boilerplate/validator");

  describe("Endpoints validation.", () => {

    test(`Undefined endpoints.`, () => {
      expect(() => {
        validateConfigure({})
      }).toThrowError(`Undefined endpoints.`);
    });

    test(`Key "endpoints" must be object.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: []
        })
      }).toThrowError(`Key "endpoints" must be object.`);
    });

    test(`Endpoints is empty.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {}
        })
      }).toThrowError(`Endpoints is empty.`);
    });

    test(`Endpoints value must be array.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "some_endpoint": 0
          }
        })
      }).toThrowError(`Endpoints value must be array.`);
    });

    test(`Endpoints key is empty string.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "": []
          }
        })
      }).toThrowError(`Endpoints key is empty string.`);
    });

    test(`scenario name must be string.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "some_endpoint": [0]
          }
        })
      }).toThrowError(`scenario name must be string.`);
    });

    test(`scenario name is empty.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "some_endpoint": [""]
          }
        })
      }).toThrowError(`scenario name is empty.`);
    });
  });

  describe("Endpoints validation.", () => {

    test(`Require "when" parameter if using "skip".`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "some_endpoint": ["some_scenario"]
          },
          skip: {}
        })
      }).toThrowError(`Require "when" parameter if using "skip".`);
    });

    test(`"when" key available value is test or reference only.`, () => {
      expect(() => {
        validateConfigure({
          endpoints: {
            "some_endpoint": ["some_scenario"]
          },
          skip: {
            when: "valid value",
          }
        })
      }).toThrowError(`"when" key available value is test or reference only.`);
    });
  });
});