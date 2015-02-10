// Test all user management functions using only a browser (and something to receive emails).
//
// There is some overlap between this and the server-tests.js, a test that fails in both is likely broken on the server side, a test that only fails here is likely broken in the client-facing code.

"use strict";
var fluid      = require("../../../node_modules/infusion/src/module/fluid");
var gpii       = fluid.registerNamespace("gpii");

var jqUnit  = fluid.require("jqUnit");
var Browser = require("zombie");

require("./test-harness.js");

function runTests() {
    var browser = Browser.create();

    jqUnit.module("End-to-end functional user management tests...");

    jqUnit.asyncTest("Login with a valid username and password...", function() {
        browser.visit( harness.express.options.config.express.baseUrl + "content/login").then(function(error){
            jqUnit.start();
            jqUnit.assertNull("There should be no errors...", error);
            jqUnit.stop();

            browser.fill("username", "admin")
                .fill("password", "admin")
                .pressButton("Log In", function() {
                    jqUnit.start();
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
            jqUnit.stop();

            browser.fill("username", "bogus")
                .fill("password", "bogus")
                .pressButton("Log In", function() {
                    jqUnit.start();
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

    // TODO: Reset a user's password

    // TODO: Try to reset the password for a user who does not exist

    // TODO: Leave out key information while resetting a user's password

    // TODO: Use an invalid reset code

    // TODO: Try to create a user with the same email address as an existing user

    // TODO: Create and verify a new user

    // TODO: Use an invalid verification code
}

// Launch all servers and then start the tests above.
var harness = gpii.express.couchuser.tests.harness({});
harness.start(runTests);
