/*
  A fluid-component for use with express.js that routes requests to the appropriate layout and page (if available).
 */
"use strict";
var fluid      = fluid || require('infusion');
var fs         = require("fs");
var gpii       = fluid.registerNamespace("gpii");
var dispatcher = fluid.registerNamespace("gpii.express.hb.dispatcher");

dispatcher.addRoutesPrivate = function(that) {
    if (!that.model.path) {
        console.log("You must configure a model.path for a gpii.express.router grade...");
        return null;
    }
    if (!that.model.config || !that.model.config.express) {
        console.error("Can't instantiate router without a working config object in our model.")
        return null;
    }

    var express   = require("express");
    that.router = express.Router();
    that.router.use(that.model.path, function(req,res) {
        var path = req.path === "/" ? "index" : req.path.substring(1);
        if (fs.existsSync(that.model.config.express.views + "/pages/" + path + ".handlebars")) {
            // TODO:  Standardize handling of data to be exposed to the client and pass it here
            var layoutDir  = that.model.config.express.views + "/layouts/";
            var filename   = fs.existsSync(layoutDir + path + ".handlebars") ? path : "main";

            var options    = JSON.parse(JSON.stringify(that.model));
            options.layout = layoutDir + filename + ".handlebars";
            options.req    = req;

            res.render("pages/" + path + ".handlebars", options);
        }
        else {
            res.status(404).render("pages/error", {message: "The page you requested was not found."});
        }
    });
};

fluid.defaults("gpii.express.hb.dispatcher", {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    model: {
        config: null,
        path:   "/dispatcher"
    },
    events: {
        addRoutes: null
    },
    invokers: {
        "addRoutes": {
            funcName: "gpii.express.hb.dispatcher.addRoutesPrivate",
            args: ["{that}"]
        }
    },
    listeners: {
        addRoutes: {
            listener: "{dispatcher}.addRoutes",
            args: ["{that}"]
        }
    }
});