// Server-side wrapper for the common helper grade.  Wires in the server-side dependencies.
"use strict";
var fluid          = require('infusion');
var namespace      = "gpii.express.hb.helpers.server";
var serverHelpers  = fluid.registerNamespace(namespace);
var pagedown       = require("pagedown");

serverHelpers.initConverter = function(that) {
    var converter = pagedown.getSanitizingConverter();
    that.applier.change("converter", converter);
};

fluid.defaults(namespace, {
    gradeNames: ["fluid.standardRelayComponent", "gpii.templates.hb.helpers", "autoInit"],
    listeners: {
        onCreate: [
            {
                funcName: namespace + ".initConverter",
                args: ["{that}"]
            }
        ]

    }
});
