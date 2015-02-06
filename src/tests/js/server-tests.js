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

function isSaneResponse(jqUnit, error, response, body, statusCode) {
    var statusCode = statusCode ? statusCode : 200;

    jqUnit.assertNull("There should be no errors.", error);

    jqUnit.assertEquals("The status code should be appropriate", statusCode, response.statusCode);

    jqUnit.assertNotNull("There should be a body.", body);
};

require("./test-harness.js");

function runTests() {
    jqUnit.module("Testing /api/user directly (no client side code)...");

    jqUnit.asyncTest("Testing full login/logout cycle...", function() {
        var jar = request.jar();
        var username = "admin";
        var password = "admin";
        var loginOptions = {
            "url":     harness.express.options.config.express.baseUrl + "api/user/signin",
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
                "url":  harness.express.options.config.express.baseUrl + "api/user/current",
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
                    "url":  harness.express.options.config.express.baseUrl + "api/user/signout",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/signin",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/signin",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/signup",
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

        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the verification code and continue the verification process
            var verificationCodeRegexp = new RegExp("api/user/verify/([a-z0-9-]+)", "i");
            var matches = content.toString().match(verificationCodeRegexp);

            jqUnit.assertNotNull("There should be a verification code in the email sent to the user.", matches);
            if (matches) {
                var code = matches[1];

                var verifyRequest = request.defaults({timeout: 500});
                var verifyOptions = {
                    "url": harness.express.options.config.express.baseUrl + "api/user/verify/" + code
                };

                verifyRequest.get(verifyOptions, function (error, response, body) {
                    jqUnit.start();
                    isSaneResponse(jqUnit, error, response, body, 200);

                    var data = typeof body === "string" ? JSON.parse(body) : body;
                    jqUnit.assertTrue("The response should be 'ok'.", data.ok);
                    jqUnit.stop();

                    var loginRequest = request.defaults({timeout: 500});
                    var loginOptions = {
                        "url": harness.express.options.config.express.baseUrl + "api/user/signin",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/signup",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/signup",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/verify/xxxxxxxxxx",
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

        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var resetCodeRegexp = new RegExp("reset/([a-z0-9-]+)", "i");
            var matches = content.toString().match(resetCodeRegexp);

            jqUnit.assertNotNull("There should be a reset code in the email sent to the user.", matches);
            if (matches) {
                var code = matches[1];

                var resetRequest = request.defaults({ timeout: 500});
                var resetOptions = {
                    "url": harness.express.options.config.express.baseUrl + "api/user/reset/",
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
                        "url": harness.express.options.config.express.baseUrl + "api/user/signin",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/forgot",
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
            "url": harness.express.options.config.express.baseUrl + "api/user/reset/",
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
};

// Launch all servers and then start the tests above.
var harness = gpii.express.couchuser.tests.harness({});
harness.start(runTests);
