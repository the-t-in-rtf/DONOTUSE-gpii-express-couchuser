// Test the "forgot password" reset mechanism end-to-end
"use strict";
var fluid      = require("../../../../node_modules/infusion/src/module/fluid");
var gpii       = fluid.registerNamespace("gpii");

var jqUnit     = fluid.require("jqUnit");
var Browser    = require("zombie");

var fs         = require("fs");

var isBrowserSane = require("./browser-sanity.js")

require("../test-harness.js");

function runTests() {
    var browser;

    jqUnit.module("End-to-end functional \"forgot password\" tests...", { "setup": function() { browser = Browser.create({ continueOnError: true });  harness.smtp.init(); }});

    jqUnit.asyncTest("Reset a user's password using the \"forgot password\" form...", function() {
        var timestamp = (new Date()).getTime();

        // Set up a handler to continue the process once we receive an email
        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var resetCodeRegexp = new RegExp("(http.+reset/[a-z0-9-]+)", "i");
            var matches = content.toString().match(resetCodeRegexp);

            jqUnit.assertNotNull("There should be a reset code in the email sent to the user.", matches);
            if (matches) {
                var resetUrl = matches[1];
                jqUnit.stop();

                // We need a separate browser to avoid clobbering the instance used to generate this email, which still needs to check the results of its activity.
                var resetBrowser = Browser.create();
                resetBrowser.visit(resetUrl).then(function(error){
                    jqUnit.start();
                    isBrowserSane(jqUnit, resetBrowser);
                    jqUnit.stop();

                    // Fill out the form
                    resetBrowser.fill("password", timestamp)
                        .fill("confirm", timestamp)
                        .pressButton("Reset Password", function() {
                            jqUnit.start();
                            isBrowserSane(jqUnit, resetBrowser);

                            // The reset form should no longer be visible
                            var resetForm = resetBrowser.window.$(".reset-form");
                            jqUnit.assertNotUndefined("There should be a reset form...", resetForm.html());
                            jqUnit.assertEquals("The reset form should be hidden...", "none", resetForm.css("display"));

                            // A "success" message should be visible
                            var feedback = resetBrowser.window.$(".success");
                            jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                            // There should be no alerts
                            var alert = resetBrowser.window.$(".alert");
                            jqUnit.assertUndefined("There should not be any alerts...", alert.html());

                            // Log in using the new details
                            jqUnit.stop();
                            resetBrowser.visit( harness.express.options.config.express.baseUrl + "content/login").then(function(error) {
                                jqUnit.start();
                                isBrowserSane(jqUnit, resetBrowser);
                                jqUnit.stop();

                                resetBrowser.fill("username", "reset")
                                    .fill("password", timestamp)
                                    .pressButton("Log In", function () {
                                        jqUnit.start();
                                        isBrowserSane(jqUnit, resetBrowser);

                                        // The login form should no longer be visible
                                        var loginForm = resetBrowser.window.$(".login-form");
                                        jqUnit.assertNotUndefined("There should be a login form...", loginForm.html());
                                        jqUnit.assertEquals("The login form should be hidden...", "none", loginForm.css("display"));

                                        // A "success" message should be visible
                                        var feedback = resetBrowser.window.$(".success");
                                        jqUnit.assertNotUndefined("There should be a positive feedback message...", feedback.html());

                                        // There should be no alerts
                                        var alert = resetBrowser.window.$(".alert");
                                        jqUnit.assertUndefined("There should not be any alerts...", alert.html());
                                    });
                            });
                        });
                });
            }
        });

        browser.visit(harness.express.options.config.express.baseUrl + "content/forgot").then(function(error){
            jqUnit.start();
            isBrowserSane(jqUnit, browser);
            jqUnit.stop();

            browser
                .fill("email", "reset@localhost")
                .pressButton("Send Email", function() {
                    jqUnit.start();
                    isBrowserSane(jqUnit, browser);

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

    jqUnit.asyncTest("Confirm that passwords must match...", function() {
        var timestamp = (new Date()).getTime();

        // Set up a handler to continue the process once we receive an email
        harness.smtp.applier.change("mailHandler", function(that, connection) {
            var content = fs.readFileSync(that.model.messageFile);

            // Get the reset code and continue the reset process
            var resetCodeRegexp = new RegExp("(http.+reset/[a-z0-9-]+)", "i");
            var matches = content.toString().match(resetCodeRegexp);

            jqUnit.assertNotNull("There should be a reset code in the email sent to the user.", matches);
            if (matches) {
                var resetUrl = matches[1];
                jqUnit.stop();

                // We need a separate browser to avoid clobbering the instance used to generate this email, which still needs to check the results of its activity.
                var resetBrowser = Browser.create();
                resetBrowser.visit(resetUrl).then(function(error){
                    jqUnit.start();
                    isBrowserSane(jqUnit, resetBrowser);
                    jqUnit.stop();

                    // Fill out the form
                    resetBrowser
                        .fill("password", timestamp)
                        .fill("confirm", timestamp + "x")
                        .pressButton("Reset Password", function() {
                            jqUnit.start();
                            isBrowserSane(jqUnit, resetBrowser);

                            // The forgot password form should be visible
                            var resetForm = resetBrowser.window.$(".reset-form");
                            jqUnit.assertNotUndefined("There should be a form...", resetForm.html());
                            jqUnit.assertEquals("The form should not be hidden...", "", resetForm.css("display"));

                            // A "success" message should not be visible
                            var feedback = resetBrowser.window.$(".success");
                            jqUnit.assertUndefined("There should not be a positive feedback message...", feedback.html());

                            // There should be an alert
                            var alert = resetBrowser.window.$(".alert");
                            jqUnit.assertNotUndefined("There should be at least one alert...", alert.html());
                            if (alert.html()) {
                                jqUnit.assertTrue("The alert should have content.", alert.html().trim().length > 0);
                            }
                        });
                });
            }
        });

        browser.visit(harness.express.options.config.express.baseUrl + "content/forgot").then(function(error){
            jqUnit.start();
            isBrowserSane(jqUnit, browser);
            jqUnit.stop();

            browser
                .fill("email", "reset@localhost")
                .pressButton("Send Email", function() {
                    jqUnit.start();
                    isBrowserSane(jqUnit, browser);

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

    jqUnit.asyncTest("Try to reset a user who doesn't exist...", function() {
        var timestamp = (new Date()).getTime();

        browser.visit(harness.express.options.config.express.baseUrl + "content/forgot").then(function(error){
            jqUnit.start();
            isBrowserSane(jqUnit, browser);
            jqUnit.stop();

            browser
                .fill("email", timestamp + "@localhost")
                .pressButton("Send Email", function() {
                    jqUnit.start();

                    // The "forgot password" form should be visible
                    var forgotForm = browser.window.$(".forgot-form");
                    jqUnit.assertNotUndefined("There should be a \"forgot password\" form...", forgotForm.html());
                    jqUnit.assertEquals("The \"forgot password\" form should not be hidden...", "", forgotForm.css("display"));

                    // A "success" message should be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertUndefined("There should not be a positive feedback message...", feedback.html());

                    // There should be no alerts
                    var alert = browser.window.$(".alert");
                    jqUnit.assertNotUndefined("There should be an alert...", alert.html());
                    if (alert.html()) {
                        jqUnit.assertTrue("The alert should have content.", alert.html().trim().length > 0);
                    }
                });
        });
    });

    jqUnit.asyncTest("Try to use an invalid reset code...", function() {
        var timestamp = (new Date()).getTime();
        browser.visit(harness.express.options.config.express.baseUrl + "content/reset/" + timestamp).then(function (error) {
            jqUnit.start();
            isBrowserSane(jqUnit, browser);
            jqUnit.stop();

            browser.fill("password", timestamp)
                .fill("confirm", timestamp)
                .pressButton("Reset Password", function() {
                    jqUnit.start();

                    // The "forgot password" form should not be visible
                    var resetForm = browser.window.$(".reset-form");
                    jqUnit.assertNotUndefined("There should be a \"reset\" form...", resetForm.html());

                    // A "success" message should not be visible
                    var feedback = browser.window.$(".success");
                    jqUnit.assertUndefined("There should not be a positive feedback message...", feedback.html());

                    // There should be at least one alert
                    var alert = browser.window.$(".alert");
                    jqUnit.assertNotUndefined("There should be an alert...", alert.html());
                    if (alert.html()) {
                        jqUnit.assertTrue("The alert should have content.", alert.html().trim().length > 0);
                    }
            });
        });
    });

    jqUnit.onAllTestsDone.addListener(function() {
        harness.stop();
    });
}

// Launch all servers and then start the tests above.
var harness = gpii.express.couchuser.tests.harness({});
harness.start(runTests);
