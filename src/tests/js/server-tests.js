// Test the couchuser APIs to ensure that all of our modules that wrap the library are working correctly.
//
// Although there are some similarities in the server setup and mail testing, these tests do not touch the client modules, and access the APIs directly.
//
// For browser tests, check out zombie-tests.js

// Instantiate a new express instance with all the required middleware
"use strict";
var fluid      = require("../../../node_modules/infusion/src/module/fluid");
var gpii       = fluid.registerNamespace("gpii");
var path       = require("path");
var request    = require("request");
var jqUnit     = fluid.require("jqUnit");
var fs         = require("fs");

require("../../../node_modules/gpii-express/src/js/helper");
require("../../../node_modules/gpii-express/src/js/express");
require("../../../node_modules/gpii-express/src/js/router");
require("../../../node_modules/gpii-express/src/js/static");
require("../../../node_modules/gpii-express/src/js/middleware");
require("../../../node_modules/gpii-express/src/js/bodyparser");
require("../../../node_modules/gpii-express/src/js/cookieparser");
require("../../../node_modules/gpii-express/src/js/session");
require("../../../node_modules/gpii-hb-helper/src/js/common/helpers");
require("../../../node_modules/gpii-hb-helper/src/js/server/dispatcher");
require("../../../node_modules/gpii-hb-helper/src/js/server/helpers-server");
require("../../../node_modules/gpii-hb-helper/src/js/server/inline");
require("../../../node_modules/gpii-pouch/src/js/pouch");
require("../../../node_modules/gpii-test-mail/src/js/mailserver");

require("../../js/server");

function isSaneResponse(jqUnit, error, response, body, statusCode) {
    var statusCode = statusCode ? statusCode : 200;

    jqUnit.assertNull("There should be no errors.", error);

    jqUnit.assertEquals("The status code should be appropriate", statusCode, response.statusCode);

    jqUnit.assertNotNull("There should be a body.", body);
};


var mailTemplateDir = path.join(__dirname, '../../js/server/templates');

var viewDir      = path.resolve(__dirname, "../views");
var modulesDir   = path.resolve(__dirname, "../../../node_modules");
var jsDir        = path.resolve(__dirname, "../../js");
var bowerDir     = path.resolve(__dirname, "../../../bower_components");

var mailServer = gpii.test.mail.smtp({
    "config": { "port": 4025 }
});
mailServer.listen();

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
        "users": "http://localhost:5984/_users",
        request_defaults: {
            auth: {
                user: 'admin',
                pass: 'admin'
            }
        },
        "email":  {
            "from": "no-reply@ul.gpii.net",
            "service": "SMTP",
            "SMTP": {
                "host": "localhost",
                "port": 4025
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

// TODO:  Figure out why our pouch instance doesn't work with express-couchuser
//For now, we use our local couch instance directly.
var userDataFile = path.resolve(__dirname, "../data/users/users.json");

// We have to have a separate pouch instance because bodyparser breaks express-pouch.
//var pouch = gpii.express({
//    "config": {
//        "express": {
//            "port" :   7534,
//            "baseUrl": "http://localhost:7534/"
//        },
//        "app": {
//            "name": "Pouch Test Server",
//            "url": "http://localhost:7534/"
//        }
//    },
//    components: {
//        "pouch": {
//            "type": "gpii.pouch",
//            "options": {
//                "path": "/",
//                "model": {
//                    "databases": {
//                        "_users": {
//                            "data": userDataFile
//                        }
//                    }
//                }
//            }
//        }
//    }
//});


express.start(function(){
    jqUnit.module("Testing /api/user directly (no client side code)...");

    jqUnit.asyncTest("Testing full login/logout cycle...", function() {
        var jar = request.jar();
        var username = "admin";
        var password = "admin";
        var loginOptions = {
            "url":     express.options.config.express.baseUrl + "api/user/signin",
            "json":    { "name": username, "password": password },
            "jar":     jar
        };

        request.post(loginOptions, function(error, response, body){
            jqUnit.start();
            isSaneResponse(jqUnit, error, response, body);

            var data = typeof body === "string" ? JSON.parse(body) : body;
            jqUnit.assertTrue("The response should be 'ok'.", data.ok);
            jqUnit.assertNotNull("There should be a user returned.", data.user);
            if (data.user) {
                jqUnit.assertEquals("The current user should be returned.", username, data.user.name);
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
                    jqUnit.assertEquals("The current user should be returned.", username, data.user.name);
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

    jqUnit.asyncTest("Testing creating and verifying a user with the same email address as an existing user...", function() {
        var jar = request.jar();
        var signupOptions = {
            "url": express.options.config.express.baseUrl + "api/user/signup",
            "json": {
                "name":     "new",
                "password": "new",
                "email":    "duhrer@localhost",
                "roles":    []
            },
            "jar": jar
        };

        request.post(signupOptions, function (error, response, body) {
            jqUnit.start();
            isSaneResponse(jqUnit, error, response, body, 400);

            var data = typeof body === "string" ? JSON.parse(body) : body;
            jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
        });
    });

    jqUnit.asyncTest("Testing creating and verifying a user end-to-end...", function() {

        var timestamp = (new Date()).getTime();
        // Apparently a username with only numbers causes problems with the data nano sends to couch.
        var username  = "username-" + timestamp;
        var password  = "password-" + timestamp;
        var email     = username + "@localhost";

        mailServer.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the verification code and continue the verification process
            var verificationCodeRegexp = new RegExp("api/user/verify/([a-z0-9-]+)", "i");
            var matches = content.toString().match(verificationCodeRegexp);

            jqUnit.assertNotNull("There should be a verification code in the email sent to the user.", matches);
            if (matches) {
                var code = matches[1];

                var verifyRequest = request.defaults({timeout: 500});
                var verifyOptions = {
                    "url": express.options.config.express.baseUrl + "api/user/verify/" + code
                };

                verifyRequest.get(verifyOptions, function (error, response, body) {
                    jqUnit.start();
                    isSaneResponse(jqUnit, error, response, body, 200);

                    var data = typeof body === "string" ? JSON.parse(body) : body;
                    jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                    jqUnit.stop();

                    var loginRequest = request.defaults({timeout: 500});
                    var loginOptions = {
                        "url": express.options.config.express.baseUrl + "api/user/signin",
                        "json": {"name": username, "password": password}
                    };

                    loginRequest.post(loginOptions, function (error, response, body) {
                        jqUnit.start();
                        isSaneResponse(jqUnit, error, response, body, 200);

                        var data = typeof body === "string" ? JSON.parse(body) : body;
                        jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                        jqUnit.assertNotUndefined("There should be a user returned.", data.user);
                    });
                });
            }
        });

        // Start the signup process now that we have a working mail server...
        var signupRequest = require("request");
        var signupOptions = {
            "url": express.options.config.express.baseUrl + "api/user/signup",
            "json": {
                "name":     username,
                "password": password,
                "email":    email,
                "roles":    []
            }
        };

        signupRequest.post(signupOptions, function (error, response, body) {
            jqUnit.start();
            isSaneResponse(jqUnit, error, response, body, 200);

            // Stop and resume when the mail server receives its message.
            jqUnit.stop();
        });
    });

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

    jqUnit.asyncTest("Testing resetting a user's password end-to-end...", function() {
        var timestamp = (new Date()).getTime();
        // Apparently a username with only numbers causes problems with the data nano sends to couch.
        var username     = "reset";
        var newPassword  = "reset";
        var email        = username + "@localhost";

        mailServer.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var resetCodeRegexp = new RegExp("reset/([a-z0-9-]+)", "i");
            var matches = content.toString().match(resetCodeRegexp);

            jqUnit.assertNotNull("There should be a reset code in the email sent to the user.", matches);
            if (matches) {
                var code = matches[1];

                var resetRequest = request.defaults({ timeout: 500});
                var resetOptions = {
                    "url": express.options.config.express.baseUrl + "api/user/reset/",
                    "json": {
                        "code":     code,
                        "password": newPassword
                    }
                };

                resetRequest.post(resetOptions, function (error, response, body) {
                    jqUnit.start();
                    isSaneResponse(jqUnit, error, response, body, 200);

                    var data = typeof body === "string" ? JSON.parse(body) : body;
                    jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                    jqUnit.stop();

                    var loginRequest = request.defaults({ timeout: 500});
                    var loginOptions = {
                        "url": express.options.config.express.baseUrl + "api/user/signin",
                        "json": {"name": username, "password": newPassword}
                    };

                    loginRequest.post(loginOptions, function (error, response, body) {
                        jqUnit.start();
                        isSaneResponse(jqUnit, error, response, body, 200);

                        var data = typeof body === "string" ? JSON.parse(body) : body;
                        jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                        jqUnit.assertNotUndefined("There should be a user returned.", data.user);
                    });
                });
            }
        });

        var forgotRequest = require("request");
        var forgotOptions = {
            "url": express.options.config.express.baseUrl + "api/user/forgot",
            "json": {
                "email":    email
            }
        };

        forgotRequest.post(forgotOptions, function (error, response, body) {
            jqUnit.start();
            isSaneResponse(jqUnit, error, response, body, 200);

            // Stop and resume when the mail server receives its message.
            jqUnit.stop();
        });
    });


    jqUnit.asyncTest("Testing using a bogus reset code...", function() {
        var newPassword  = "reset";
        var resetRequest = request.defaults({ timeout: 500});
        var resetOptions = {
            "url": express.options.config.express.baseUrl + "api/user/reset/",
            "json": {
                "code":     "utter-nonsense-which-should-never-work",
                "password": newPassword
            }
        };

        resetRequest.post(resetOptions, function (error, response, body) {
            jqUnit.start();
            isSaneResponse(jqUnit, error, response, body, 500);

            var data = typeof body === "string" ? JSON.parse(body) : body;
            jqUnit.assertFalse("The response should not be 'ok'.", data.ok);
        });
    });
});

