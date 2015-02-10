// Test all user management functions using only a browser (and something to receive emails).
//
// There is some overlap between this and the server-tests.js, a test that fails in both is likely broken on the server side, a test that only fails here is likely broken in the client-facing code.

"use strict";
var fluid      = require("../../../node_modules/infusion/src/module/fluid");
var gpii       = fluid.registerNamespace("gpii");

var jqUnit     = fluid.require("jqUnit");
var Browser    = require("zombie");

var fs         = require("fs");

require("./test-harness.js");

function runTests() {
    var browser;

    jqUnit.module("End-to-end functional user management tests...", { "setup": function() { browser = Browser.create(); }});

    jqUnit.asyncTest("Login with a valid username and password...", function() {
        browser.visit( harness.express.options.config.express.baseUrl + "content/login").then(function(error){
            jqUnit.start();
            jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);
            jqUnit.stop();

            browser.fill("username", "admin")
                .fill("password", "admin")
                .pressButton("Log In", function() {
                    jqUnit.start();

                    jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);

                    // The login form should no longer be visible
                    var loginForm = browser.window.$(".login-form");
                    jqUnit.assertNotUndefined("There should be a login form...", loginForm.html());
                    jqUnit.assertEquals("The login form should not be hidden...", "none", loginForm.css("display"));

                    // A "success" message should be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = browser.window.$(".alert");
                    jqUnit.assertUndefined("There should not be any alerts...", alert.html());
                });
        });
    });

    jqUnit.asyncTest("Login with an invalid username and password...", function() {
        browser.visit( harness.express.options.config.express.baseUrl + "content/login").then(function(error){
            jqUnit.start();
            jqUnit.assertNull("There should be no errors...", error);
            jqUnit.assertFalse("There should be no errors:" + JSON.stringify(browser.errors), browser.errors && browser.errors.length > 0)
            jqUnit.stop();

            browser.fill("username", "bogus")
                .fill("password", "bogus")
                .pressButton("Log In", function() {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);

                    // The login form should be visible
                    var loginForm = browser.window.$(".login-form");
                    jqUnit.assertNotUndefined("There should be a login form...", loginForm.html());
                    jqUnit.assertEquals("The login form should not be hidden...", "", loginForm.css("display"));

                    // A "success" message should be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertUndefined("There should not be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = browser.window.$(".alert");
                    jqUnit.assertNotUndefined("There should be an alert...", alert.html());
                });
        });
    });

    jqUnit.asyncTest("Reset a user's password using the \"forgot password\" form...", function() {
        // Set up a handler to continue the process once we receive an email
        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var resetCodeRegexp = new RegExp("(http.+reset/[a-z0-9-]+)", "i");
            var matches = content.toString().match(resetCodeRegexp);

            jqUnit.assertNotNull("There should be a reset code in the email sent to the user.", matches);
            if (matches) {
                var timestamp = (new Date()).getTime();
                var resetUrl = matches[1];
                jqUnit.stop();
                browser.visit(resetUrl).then(function(error){
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);
                    jqUnit.stop();

                    // Fill out the form
                    browser.fill("password", timestamp)
                        .fill("confirm", timestamp)
                        .pressButton("Reset Password", function() {
                            jqUnit.start();

                            // TODO: Check for success messages and alerts

                            // TODO: Confirm that the form is hidden

                            // TODO: Try to log in using the new details
                        });
                });
            }
        });

        browser.visit(harness.express.options.config.express.baseUrl + "content/forgot").then(function(error){
            jqUnit.start();
            jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);
            jqUnit.stop();

            // TODO:  There are messages about not having a working $.  Investigate.
            browser.fill("email", "reset@localhost")
                .pressButton("Send Email", function() {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors:" + JSON.stringify(error), error);

                    // The "forgot password" form should not be visible
                    var forgotForm = browser.window.$(".forgot-form");
                    jqUnit.assertNotUndefined("There should be a \"forgot password\" form...", forgotForm.html());
                    jqUnit.assertEquals("The \"forgot password\" form should be hidden...", "none", forgotForm.css("display"));

                    // A "success" message should be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = browser.window.$(".alert");
                    jqUnit.assertUndefined("There should not be an alert...", alert.html());
                });
        });
    });

    // TODO: Confirm that the password reset doesn't work if the user fills in different passwords

    // TODO: Try to reset the password for a user who does not exist

    // TODO: Leave out key information while resetting a user's password

    // TODO: Use an invalid reset code

    // TODO: Try to create a user with the same email address as an existing user

    // TODO: Create and verify a new user

    // TODO: Use an invalid verification code
}

// Launch all servers and then start the tests above.
var harness = gpii.express.couchuser.tests.harness({});
//harness.start();
harness.start(runTests);
