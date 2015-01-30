"use strict";
// This script will take one or more server-side template directories and inline their contents on a page.  Used to expose templates for client-side rendering.
var fluid  = fluid || require('infusion');
var inline = fluid.registerNamespace("gpii.express.hb.inline");
var fs     = require('fs');

inline.loadTemplates =  function (that, dir, res) {
    var dirContents = fs.readdirSync(dir);
    dirContents.forEach(function(entry){
        var path = dir + "/" + entry;
        var stats = fs.statSync(path);
        if (stats.isFile()) {
            var matches = that.model.hbsExtensionRegexp.exec(entry);
            if (matches) {
                var templateType = dir.indexOf("partials") !== -1 ? "partial" : "template";
                var key =  templateType + "-" + matches[1];

                // cache file information so that we only reload templates that have been updated
                if (that.model.cache[key] && stats.mtime.getTime() === that.model.cache[key].mtime.getTime()) {
                    //console.log("Skipping cached " + templateType + " '" + key + "'...");
                }
                else {
                    that.model.updated = true;
                    that.model.cache[key] = {
                        mtime: stats.mtime,
                        content: fs.readFileSync(path)
                    };
                }
            }
        }
        else if (stats.isDirectory()) {
            // call the function recursively for each directory
            inline.loadTemplates(that, path, res);
        }
    });
};


inline.wrapTemplate = function (that, key, content) {
    // We have to pseudo-escape script tags to avoid them breaking our templates.
    return '<script id="' + key + '" type="text/x-handlebars-template">' + content.toString().replace(that.model.hbsScriptRegexp,"{{!}}$1") + "</script>\n\n";
};

inline.addRoutesPrivate = function(that) {
    if (!that.model.config || !that.model.config.express || !that.model.config.express.views) {
        console.log("You must configure a view directory (config.express.views)...");
        return;
    }
    if (!that.model.path) {
        console.log("You must configure a model.path for a gpii.express.router grade...");
        return;
    }

    var express   = require("express");
    that.router = express.Router();
    that.router.get(that.model.path, function(req,res) {
        inline.loadTemplates(that, fluid.resolvePath(that.model.config.express.views), res);

        if (that.model.updated) {
            //console.log("Generating html output...");
            that.model.html = "";
            Object.keys(that.model.cache).forEach(function(key){
                that.model.html += inline.wrapTemplate(that, key, that.model.cache[key].content);
            });
        }
        else {
            //console.log("Sending cached html output...");
        }

        res.status(200).send(that.model.html);
    });
};


fluid.defaults("gpii.express.hb.inline", {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    model: {
        cache:              {},
        config:             null,
        hbsExtensionRegexp: /^(.+)\.(?:hbs|handlebars)$/,
        hbsScriptRegexp:    /(script>)/g,
        html:               "",
        path:               "/inline",
        updated:            false
    },
    events: {
        addRoutes: null
    },
    invokers: {
        "addRoutes": {
            funcName: "gpii.express.hb.inline.addRoutesPrivate",
            args: ["{that}"]
        }
    },
    listeners: {
        addRoutes: {
            listener: "{inline}.addRoutes",
            args: ["{that}"]
        }
    }
});