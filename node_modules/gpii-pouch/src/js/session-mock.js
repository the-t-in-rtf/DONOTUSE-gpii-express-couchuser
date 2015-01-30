// Mocked implementation of couch's _session functionality, since pouch does not provide it and we need it for our tests.
"use strict";
var namespace   = "gpii.pouch.tests.session";
var fluid       = fluid || require('infusion');
var gpii        = fluid.registerNamespace("gpii");
var sessionMock = fluid.registerNamespace(namespace);

sessionMock.addRoutesPrivate = function(that) {
    if (!that.options.path) {
        console.log("You must configure a path for a gpii.express.router grade...");
        return null;
    }

    // Everyone is always already logged in
    that.model.router.get(that.options.path, function(req,res) {
        res.status(200).send({"ok":true,"userCtx":{"name":"admin","roles":["_admin","admin"]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}});
    });

    // Every login is successful
    that.model.router.post(that.options.path, function(req,res) {
        res.cookie('AuthSession',"",{"path":"/", "httpOnly":true});
        res.status(200).send({"ok":true,"name": req.body.name, "roles":["_admin","admin"]});
    });

    // Every session delete is silently ignored
    that.model.router.delete(that.options.path, function(req,res) {
        res.status(200).send({"ok":true});
    });
};

fluid.defaults(namespace, {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    path:   "/",
    model: {
        router: null
    },
    events: {
        addRoutes: null
    },
    listeners: {
        "addRoutes": {
            funcName: namespace + ".addRoutesPrivate",
            args: ["{that}"]
        }
    }
});