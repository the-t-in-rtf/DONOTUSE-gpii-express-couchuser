// Utility functions to add pouch to an existing express instance
"use strict";
var fluid     = require('infusion');
var namespace = "gpii.pouch";
var pouch     = fluid.registerNamespace(namespace);
var path      = require("path");

pouch.addRoutesPrivate = function(that) {
    if (!that.options.path) {
        console.error("You must configure a path for a gpii.express.router grade...");
        return null;
    }

    if (!that.model.router) {
        console.error("Our router must be configured before we attempt to add our routes.");
        return null;
    }

    var PouchDB    = require('pouchdb');
    var MemPouchDB = PouchDB.defaults({db: require('memdown')});

    if (that.model.databases && Object.keys(that.model.databases).length > 0) {
        Object.keys(that.model.databases).forEach(function(key){
            var dbConfig = that.model.databases[key];
            var db = new MemPouchDB(key);
            if (dbConfig.data) {
                var data = require(dbConfig.data);
                db.bulkDocs(data);
            }
        });
    }

    that.model.router.use(that.options.path, require('express-pouchdb')(MemPouchDB));
};

// TODO:  Write a change listener to allow easy adding of new databases

/*
    The 'databases' option is expected to be an array keyed by dbName, with options to control whether data is loaded or not, as in:

    databases: {
        "nodata": {},
        "data":   { "data": "../tests/data/records.json" }
    }
 */
fluid.defaults(namespace, {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    config:     "{gpii.express}.options.config",
    path:      "/",
    model: {
        router:    null,
        databases: {}
    },
    listeners: {
        "addRoutes": {
            funcName: namespace + ".addRoutesPrivate",
            args: ["{that}"]
        }
    }
});

