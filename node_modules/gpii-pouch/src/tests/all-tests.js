/* Tests for the "pouch" module */
"use strict";
var namespace  = "gpii.pouch.tests";
var fluid      = fluid || require('infusion');
var gpii       = fluid.registerNamespace("gpii");
var path       = require("path");
var jqUnit     = fluid.require("jqUnit");
var request    = require("request");

require("../../node_modules/gpii-express/src/js/express");
require("../../node_modules/gpii-express/src/js/router");
require("../../node_modules/gpii-express/src/js/middleware");
require("../../node_modules/gpii-express/src/js/bodyparser");
require("../js/session-mock.js");
require("../js/pouch.js");

function isSaneResponse(jqUnit, error, response, body) {
    jqUnit.assertNull("There should be no errors.", error);

    jqUnit.assertEquals("The response should have a reasonable status code", 200, response.statusCode);
    if (response.statusCode !== 200) {
        console.log(JSON.stringify(body, null, 2));
    }

    jqUnit.assertNotNull("There should be a body.", body);
};

var dataDir = path.resolve(__dirname, "./data/data.json");
var pouch = gpii.express({
    "config": {
        "express": {
            "port" :   7532,
            "baseUrl": "http://localhost:7532/"
        }
    },
    components: {
        "session": {
            type: "gpii.pouch.tests.session"
        },
        "pouch": {
            type: "gpii.pouch",
            options: {
                model: {
                    "databases": {
                        "data":   { "data": dataDir },
                        "nodata": {}
                    }
                }
            }
        }
    }
});

pouch.start(function() {
    jqUnit.module("Testing pouch module stack...");

    jqUnit.asyncTest("Testing the root of the pouch instance...", function() {
        var options = {
            url: pouch.options.config.express.baseUrl
        };
        request.get(options, function(error, response, body){
            jqUnit.start();
            isSaneResponse(jqUnit, error,response, body);
        });
    });

    jqUnit.asyncTest("Testing the 'data' database (should contain data)...", function() {
        var options = {
            url: pouch.options.config.express.baseUrl + "data"
        };
        request.get(options, function(error, response, body){
            jqUnit.start();
            isSaneResponse(jqUnit, error,response, body);

            var data = JSON.parse(body);
            jqUnit.assertTrue("There should be records.", data.doc_count && data.doc_count > 0);
        });
    });

    jqUnit.asyncTest("Testing the 'nodata' database (should contain data)...", function() {
        var options = {
            url: pouch.options.config.express.baseUrl + "nodata"
        };
        request.get(options, function(error, response, body){
            jqUnit.start();
            isSaneResponse(jqUnit, error,response, body);

            var data = JSON.parse(body);
            jqUnit.assertEquals("There should be no records.", 0, data.doc_count);
        });
    });
});

