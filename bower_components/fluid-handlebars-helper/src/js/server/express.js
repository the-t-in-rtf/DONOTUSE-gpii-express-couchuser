// Utility function to spin up an express instance.
// TODO:  Abstract this out to a more generalized package that can manage its middleware and replace in UL, PTD, and here
"use strict";
var fluid       = fluid || require("infusion");
var express     = fluid.registerNamespace("gpii.express");

require("./router");
require("./dispatcher");
require("./inline");
require("./helpers");

express.initExpress = function(that) {
    that.express     = require("express")();

    var exphbs = require("express-handlebars");
    var handlebarsConfig = {
        defaultLayout: "main",
        helpers:       that.helpers.getHelpers(),
        layoutsDir:    that.model.config.express.views + "/layouts/",
        partialsDir:   that.model.config.express.views + "/partials/"
    };

    that.express.engine("handlebars", exphbs(handlebarsConfig));
    that.express.set("view engine", "handlebars");
    that.express.set("views", that.model.config.express.views);

    // TODO:  Make this modular so that all modules of the right marker class are added
    // Add all routes from our child modules.
    that.inline.events.addRoutes.fire();
    that.express.use("/", that.inline.router);

    that.dispatcher.events.addRoutes.fire();
    that.express.use("/", that.dispatcher.router);
};

express.startPrivate = function(that, callback) {
    that.express.set("port", that.model.config.express.port);
    var http = require("http");
    http.createServer(that.express).listen(that.model.config.express.port, function(){
        console.log("Express server listening on port " + that.express.get("port"));

        console.log("Express started...");

        if (callback) {
            callback();
        }
    });
};


fluid.defaults("gpii.express", {
    gradeNames: ["fluid.standardRelayComponent", "autoInit"],
    model: {
        config: null
    },
    invokers: {
        "init": {
            funcName: "gpii.express.initExpress"
        },
        start: {
            funcName: "gpii.express.startPrivate",
            args: ["{that}", "{arguments}.0"]
        }
    },
    listeners: {
        onCreate: [
            {
                "funcName": "{express}.init",
                "args": "{that}"
            }
        ]
    },
    components: {
        inline: {
            type: "gpii.express.hb.inline",
            options: {
                model: {
                    config: "{express}.model.config"
                }
            }
        },
        dispatcher: {
            type: "gpii.express.hb.dispatcher",
            options: {
                model: {
                    config: "{express}.model.config"
                }
            }
        },
        helpers: {
            type: "gpii.express.hb.helpers"
        }
    }
});

