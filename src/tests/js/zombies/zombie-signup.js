// Test all user management functions using only a browser (and something to receive emails).
//
// There is some overlap between this and the server-tests.js, a test that fails in both is likely broken on the server side, a test that only fails here is likely broken in the client-facing code.

"use strict";
var fluid         = require("../../../../node_modules/infusion/src/module/fluid");
var gpii          = fluid.registerNamespace("gpii");

var jqUnit        = fluid.require("jqUnit");
var Browser       = require("zombie");

var fs            = require("fs");

var isBrowserSane = require("./browser-sanity.js")

require("../test-harness.js");

function runTests() {
    var browser;

    jqUnit.module("End-to-end functional signup tests...", { "setup": function() { browser = Browser.create(); }});

    jqUnit.asyncTest("Create and verify a new user...", function() {
        var timestamp = (new Date()).getTime();
        var username  = "user-" + timestamp;
        var password  = "pass-" + timestamp;
        var email     = "email-" + timestamp + "@localhost";

        // Set up a handler to continue the process once we receive an email
        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var verifyCodeRegexp = new RegExp("(http.+verify/[a-z0-9-]+)", "i");
            var matches = content.toString().match(verifyCodeRegexp);

            jqUnit.assertNotNull("There should be a verification code in the email sent to the user.", matches);
            if (matches) {
                var verifyUrl = matches[1];
                jqUnit.stop();

                // We need a separate browser to avoid clobbering the instance used to generate this email, which still needs to check the results of its activity.
                var verifyBrowser = Browser.create();
                verifyBrowser.visit(verifyUrl).then(function(error){
                    jqUnit.start();
                    isBrowserSane(jqUnit, verifyBrowser);

                    // A "success" message should be visible
                    var feedback = verifyBrowser.window.$(".success");
                    jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = verifyBrowser.window.$(".alert");
                    jqUnit.assertUndefined("There should not be an alert...", alert.html());

                    // Log in using the new account
                    jqUnit.stop();
                    verifyBrowser.visit( harness.express.options.config.express.baseUrl + "content/login").then(function(error) {
                        jqUnit.start();
                        isBrowserSane(jqUnit, verifyBrowser);
                        jqUnit.stop();

                        verifyBrowser.fill("username", "reset")
                            .fill("password", timestamp)
                            .pressButton("Log In", function () {
                                jqUnit.start();
                                isBrowserSane(jqUnit, verifyBrowser);

                                // The login form should no longer be visible
                                var loginForm = verifyBrowser.window.$(".login-form");
                                jqUnit.assertNotUndefined("There should be a login form...", loginForm.html());
                                jqUnit.assertEquals("The login form should not be hidden...", "none", loginForm.css("display"));

                                // A "success" message should be visible
                                var feedback = verifyBrowser.window.$(".success");
                                jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                                // There should be no alerts
                                var alert = verifyBrowser.window.$(".alert");
                                jqUnit.assertUndefined("There should not be any alerts...", alert.html());
                            });
                    });
                });
            }
        });

        browser.visit(harness.express.options.config.express.baseUrl + "content/signup").then(function(error){
            jqUnit.start();
            isBrowserSane(jqUnit, browser);
            jqUnit.stop();

            browser
                .fill("username", username)
                .fill("password", password)
                .fill("confirm",  password)
                .fill("email", email)
                .pressButton("Sign Up", function() {
                    jqUnit.start();
                    isBrowserSane(jqUnit, browser);

                    // The signup form should not be visible
                    var signupForm = browser.window.$(".signup-form");
                    jqUnit.assertNotUndefined("There should be a signup form...", signupForm.html());
                    jqUnit.assertEquals("The signup form should be hidden...", "none", signupForm.css("display"));

                    // A "success" message should be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = browser.window.$(".alert");
                    jqUnit.assertUndefined("There should not be an alert...", alert.html());
                });
        });
    });

    // TODO: Try to create a user with the same email address as an existing user

    // TODO: Try to create a user with mismatching passwords

    // TODO: Use an invalid verification code
}

// Launch all servers and then start the tests above.
var harness = gpii.express.couchuser.tests.harness({});
harness.start(runTests);
//harness.start();
