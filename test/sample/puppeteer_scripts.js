const spy = require("./spy");

module.exports = preimplements => ({
    ...preimplements,

    subscenarioScriptBefore: async (page, scenario, vp) =>
        spy.notifyCalled(`CALLED subscenarioScriptBefore FROM ${scenario.label}`),


    scriptA: async (page, scenario, vp) =>
        spy.notifyCalled(`CALLED scriptA FROM ${scenario.label}`),

        
    subscenarioScriptReady: async (page, scenario, vp) =>
        spy.notifyCalled(`CALLED subscenarioScriptReady FROM ${scenario.label}`),


    scriptB: async (page, scenario, vp) =>
        spy.notifyCalled(`CALLED scriptB FROM ${scenario.label}`),
});
