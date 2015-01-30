/* Library to add key helper functions to express handlebars */
"use strict";
var fluid = require('infusion');
var helpers = fluid.registerNamespace("gpii.express.hb.helpers");

// TODO:  We need a clean way to include these from both the client and server side, they are duplicated for now...
helpers.md = function(options) {
    // TODO:  This just returns the text for now, we need an actual implementation
    return options.fn(this);
};

helpers.jsonify    = function(context) { return JSON.stringify(context); };
helpers.getHelpers = function() {
    return {
        jsonify: helpers.jsonify,
        md:      helpers.md
    };
};

fluid.defaults("gpii.express.hb.helpers", {
    gradeNames: ["fluid.standardRelayComponent", "autoInit"],
    model: {},
    invokers: {
        "getHelpers": {
            funcName: "gpii.express.hb.helpers.getHelpers"
        },
        "jsonify": {
            funcName: "gpii.express.hb.helpers.jsonify"
        },
        "md": {
            funcName: "gpii.express.hb.helpers.md"
        },
        "init": {
            funcName: "gpii.express.initExpress"
        }

    }
});
