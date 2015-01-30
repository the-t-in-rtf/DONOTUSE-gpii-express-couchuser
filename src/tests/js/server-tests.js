// Test the couchuser APIs to ensure that all of our modules that wrap the library are working correctly.
//
// For browser tests, check out zombie-tests.js

// Set up pouch

// Instantiate a new express instance with all the required middleware
"use strict";
var fluid     = require("../../../node_modules/infusion/src/module/fluid");
var gpii      = fluid.registerNamespace("gpii");
var path      = require("path");
var request   = require("request");
var jqUnit    = fluid.require("jqUnit");

require("../../../node_modules/gpii-express/src/js/helper");
require("../../../node_modules/gpii-express/src/js/express");
require("../../../node_modules/gpii-express/src/js/router");
require("../../../node_modules/gpii-express/src/js/static");
require("../../../node_modules/gpii-express/src/js/middleware");
require("../../../node_modules/gpii-express/src/js/bodyparser");
require("../../../node_modules/gpii-express/src/js/cookieparser");
require("../../../node_modules/gpii-express/src/js/session");
require("../../../node_modules/gpii-pouch/src/js/pouch");
require("../../../node_modules/gpii-pouch/src/js/session-mock");
require("../../../node_modules/gpii-hb-helper/src/js/common/helpers");
require("../../../node_modules/gpii-hb-helper/src/js/server/dispatcher");
require("../../../node_modules/gpii-hb-helper/src/js/server/helpers-server");
require("../../../node_modules/gpii-hb-helper/src/js/server/inline");

require("../../js/server");

var viewDir     = path.resolve(__dirname, "../views");
var modulesDir  = path.resolve(__dirname, "../../../node_modules");
var jsDir       = path.resolve(__dirname, "../../js");
var bowerDir    = path.resolve(__dirname, "../../../bower_components");
var userDataDir = path.resolve(__dirname, "../data/users/users.json");

function isSaneResponse(jqUnit, error, response, body, statusCode) {
    var statusCode = statusCode ? statusCode : 200;

    jqUnit.assertNull("There should be no errors.", error);

    jqUnit.assertEquals("The status code should be appropriate", statusCode, response.statusCode);

    jqUnit.assertNotNull("There should be a body.", body);
};


var mailTemplateDir = path.join(__dirname, '../../js/server/templates');

var express = gpii.express({
    "config": {
        "express": {
            "port" :   7533,
            "baseUrl": "http://localhost:7533/",
            "views":   viewDir,
            "session": {
                "secret": "Printer, printer take a hint-ter."
            }
        },
        "app": {
            "name": "GPII Express Couchuser Test Server",
            "url": "http://localhost:7533/"
        },
        "users": "http://admin:admin@localhost:7534/_users",
        "email":  {
            "from": "no-reply@ul.gpii.net",
            "service": "SMTP",
            "SMTP": {
                "host": "localhost",
                "port": 25
            },
            "templateDir": mailTemplateDir
        },
        "verify": true,
        "safeUserFields": "name email displayName",
        "adminRoles": [ "admin"]
    },
    components: {
        "bodyparser": {
            "type": "gpii.express.middleware.bodyparser"
        },
        "cookieparser": {
            "type": "gpii.express.middleware.cookieparser"
        },
        "session": {
            "type": "gpii.express.middleware.session"
        },
        "user": {
            "type": "gpii.express.couchuser.server"
        },
        "dispatcher": {
            "type": "gpii.express.hb.dispatcher",
            "options": {
                path: "/content"
            }
        },
        "handlebars": {
            "type":  "gpii.express.hb.inline",
            "options": {
                path: "/hbs"
            }
        },
        "modules": {
            "type":  "gpii.express.router.static",
            "options": {
                path:    "/modules",
                content: modulesDir
            }
        },
        "js": {
            "type":  "gpii.express.router.static",
            "options": {
                path:    "/js",
                content: jsDir
            }
        },
        "bc": {
            "type":  "gpii.express.router.static",
            "options": {
                path:    "/bc",
                content: bowerDir
            }
        }
    }
});

// We have to have a separate pouch instance because bodyparser breaks express-pouch.
//
// However, session-mock requires bodyparser, so we have to give it its own as a component.
var pouch = gpii.express({
    "config": {
        "express": {
            "port" :   7534,
            "baseUrl": "http://localhost:7534/"
        },
        "app": {
            "name": "Pouch Test Server",
            "url": "http://localhost:7534/"
        }
    },
    components: {
        "pouch": {
            "type": "gpii.pouch",
            "options": {
                "path": "/",
                "model": {
                    "databases": {
                        "_users": {
                            "data": userDataDir
                        }
                    }
                },
                components: {
                    "mockSession": {
                        "type": "gpii.pouch.tests.session",
                        "options": {
                            "path": "/_session",
                            "components": {
                                "bodyparser": {
                                    "type": "gpii.express.middleware.bodyparser"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

express.start(function(){
    pouch.start(function(){
        jqUnit.module("Testing /api/user directly (no client side code)...");

        jqUnit.asyncTest("Testing full login/logout cycle...", function() {
            var jar = request.jar();
            var loginOptions = {
                "url":     express.options.config.express.baseUrl + "api/user/signin",
                "json":    { "name": "admin", "password": "admin" },
                "jar":     jar
            };

            request.post(loginOptions, function(error, response, body){
                jqUnit.start();
                isSaneResponse(jqUnit, error, response, body);

                var data = typeof body === "string" ? JSON.parse(body) : body;
                jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                jqUnit.assertNotNull("There should be a user returned.", data.user);
                if (data.user) {
                    jqUnit.assertEquals("The current user should be returned.", "admin", data.user.name);
                }

                jqUnit.stop();
                var checkCurrentOptions = {
                    "url":  express.options.config.express.baseUrl + "api/user/current",
                    "jar":  jar
                };
                request.get(checkCurrentOptions, function(error, response, body){
                    jqUnit.start();

                    isSaneResponse(jqUnit, error, response, body);

                    var data = typeof body === "string" ? JSON.parse(body) : body;
                    jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                    jqUnit.assertNotNull("There should be a user returned.", data.user);
                    if (data.user) {
                        jqUnit.assertEquals("The current user should be returned.", "admin", data.user.name);
                    }

                    jqUnit.stop();
                    var logoutOptions = {
                        "url":  express.options.config.express.baseUrl + "api/user/signout",
                        "jar":  jar
                    };
                    request.post(logoutOptions, function(error, response,body){
                        jqUnit.start();

                        isSaneResponse(jqUnit, error, response, body);

                        var data = typeof body === "string" ? JSON.parse(body) : body;
                        jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                        jqUnit.assertNotNull("There should not be a user returned.", data.user);

                        jqUnit.stop();

                        // We should no longer be able to view the current user
                        request.get(checkCurrentOptions, function(error,response,body){
                            jqUnit.start();

                            isSaneResponse(jqUnit, error, response, body, 401);

                            var data = typeof body === "string" ? JSON.parse(body) : body;
                            jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
                            jqUnit.assertUndefined("There should not be a user returned.", data.user);
                        });
                    })
                });

            });
        });

        jqUnit.asyncTest("Testing logging in with a bogus username/password...", function() {
            var jar = request.jar();
            var loginOptions = {
                "url": express.options.config.express.baseUrl + "api/user/signin",
                "json": {"name": "bogus", "password": "bogus"},
                "jar": jar
            };

            request.post(loginOptions, function (error, response, body) {
                jqUnit.start();
                isSaneResponse(jqUnit, error, response, body, 500);

                var data = typeof body === "string" ? JSON.parse(body) : body;
                jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
                jqUnit.assertUndefined("There should not be a user returned.", data.user);
            });
        });

        jqUnit.asyncTest("Testing logging in with an unverified username...", function() {
            var jar = request.jar();
            var loginOptions = {
                "url": express.options.config.express.baseUrl + "api/user/signin",
                "json": {"name": "unverified", "password": "unverified"},
                "jar": jar
            };

            request.post(loginOptions, function (error, response, body) {
                jqUnit.start();
                isSaneResponse(jqUnit, error, response, body, 401);

                var data = typeof body === "string" ? JSON.parse(body) : body;
                jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
                jqUnit.assertUndefined("There should not be a user returned.", data.user);
            });
        });

        // TODO:  This test hangs the whole operation.  Investigate.
        //
        //// Bypass mail handling, which is tested in the library itself.  Get the verification code from couch.
        //jqUnit.asyncTest("Testing creating and verifying a user with the same email address as an existing user...", function() {
        //    var jar = request.jar();
        //    var signupOptions = {
        //        "url": express.options.config.express.baseUrl + "api/user/signup",
        //        "json": {
        //            "name":     "new",
        //            "password": "new",
        //            "email":    "duhrer@localhost",
        //            "roles":    []
        //        },
        //        "jar": jar
        //    };
        //
        //    request.post(signupOptions, function (error, response, body) {
        //        jqUnit.start();
        //        isSaneResponse(jqUnit, error, response, body, 400);
        //
        //        var data = typeof body === "string" ? JSON.parse(body) : body;
        //        jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
        //    });
        //});

        // TODO:  Complete this example
        //// Bypass mail handling, which is tested in the library itself.  Get the verification code from couch.
        //jqUnit.asyncTest("Testing creating and verifying a user...", function() {
        //    var timestamp = (new Date()).getTime();
        //    var jar = request.jar();
        //    var signupOptions = {
        //        "url": express.options.config.express.baseUrl + "api/user/signup",
        //        "json": {
        //            "name":     timestamp,
        //            "password": timestamp,
        //            "email":    timestamp + "duhrer@localhost",
        //            "roles":    []
        //        },
        //        "jar": jar
        //    };
        //
        //
        //    request.post(signupOptions, function (error, response, body) {
        //        jqUnit.start();
        //        isSaneResponse(jqUnit, error, response, body, 500);
        //
        //        var data = typeof body === "string" ? JSON.parse(body) : body;
        //        jqUnit.assertTrue("The response should be 'ok'.", data.ok);
        //    });
        //});

        jqUnit.asyncTest("Testing creating a user without providing the required information...", function() {
            var jar = request.jar();
            var signupOptions = {
                "url": express.options.config.express.baseUrl + "api/user/signup",
                "json": {},
                "jar": jar
            };

            request.post(signupOptions, function (error, response, body) {
                jqUnit.start();
                isSaneResponse(jqUnit, error, response, body, 400);

                var data = typeof body === "string" ? JSON.parse(body) : body;
                jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
            });
        });

        jqUnit.asyncTest("Testing using a bogus verification code...", function() {
            var jar = request.jar();
            var signupOptions = {
                "url": express.options.config.express.baseUrl + "api/user/verify/xxxxxxxxxx",
                "json": {},
                "jar": jar
            };

            request.get(signupOptions, function (error, response, body) {
                jqUnit.start();
                isSaneResponse(jqUnit, error, response, body, 400);

                var data = typeof body === "string" ? JSON.parse(body) : body;
                jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
            });
        });

        // TODO:  Test resetting a real user's password
        // Bypass mail handling, which is tested in the library itself.  Get the reset code from couch.

        // TODO:  Test resetting a bogus user's password

        // TODO:  Test resetting a real user's password using a bogus code

    });
});
