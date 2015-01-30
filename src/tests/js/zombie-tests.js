// Test all server side modules (including basic template rendering)...
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var path  = require("path");
fluid.registerNamespace("gpii.express");

require("../../../node_modules/gpii-express/src/js/express");
require("../../../node_modules/gpii-express/src/js/router");
require("../../../node_modules/gpii-express/src/js/middleware");
require("../../../node_modules/gpii-express/src/js/static");
require("../../../node_modules/gpii-express/src/js/helper");

require("../../js/common/helpers");
require("../../js/server/helpers-server");
require("../../js/server/inline");

var bcDir      = path.resolve(__dirname, "../../../bower_components");
var contentDir = path.resolve(__dirname, "../html");
var srcDir     = path.resolve(__dirname, "../../../src");
var modulesDir = path.resolve(__dirname, "../../../node_modules");
var viewDir    = path.resolve(__dirname, "../views");

var testServer = gpii.express({
    config:  {
        "express": {
            "port" :   6994,
            "baseUrl": "http://localhost:6994/",
            "views":   viewDir
        }
    },
    components: {
        inline: {
            type: "gpii.express.hb.inline",
            "options": {
                "path": "/hbs"
            }
        },
        bc: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/bc",
                content: bcDir
            }
        },
        js: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/src",
                content: srcDir
            }
        },
        modules: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/modules",
                content: modulesDir
            }
        },
        content: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/content",
                content: contentDir
            }
        },
        helpers: {
            type: "gpii.express.hb.helpers.server"
        }
    }
});

testServer.runTests = function() {
    var jqUnit  = fluid.require("jqUnit");
    var Browser = require("zombie");
    var browser = Browser.create();

    jqUnit.module("Integration tests for combined client and server-side template handling...");

    jqUnit.asyncTest("Use zombie.js to run the client-side tests...", function() {
        browser.on("error", function(error){
            jqUnit.start();
            jqUnit.assertNull("There should be no errors...", error);
        });
        browser.visit( testServer.options.config.express.baseUrl + "content/client-tests.html").then(function () {
            jqUnit.start();

            // Zombie provides its own assert library, but we can also just use its jQuery to inspect the DOM.
            var failures = 0;
            browser.window.$(".counts .failed").each(function(index, value){
                var element = browser.window.$(value);
                failures += parseInt(element.text());
            });
            jqUnit.assertEquals("There should be no failed tests...", "0", failures);

            var passes = 0;
            browser.window.$(".counts .passed").each(function(index, value){
                var element = browser.window.$(value);
                passes += parseInt(element.text());
            });
            jqUnit.assertTrue("There should be passed tests...", passes > 0);

            // Output the qunit summary as part of our results.
            console.log("Browser Test Summary:\n\t" + browser.window.$("#qunit-testresult").text());
        });
    });
};

testServer.start(function() {
    testServer.runTests();
});

