/*

 // TODO:  Generalize both functions and make them available as both client and server modules

 templates.mdHelper = function(options) {
 if (Markdown && Markdown.getSanitizingConverter) {
 var converter = Markdown.getSanitizingConverter();
 // Double all single carriage returns so that they result in new paragraphs, at least for now
 converter.hooks.chain("preConversion", function (text) { return text.replace(/[\r\n]+/g, "\n\n"); });
 return converter.makeHtml(options.fn(this));
 }
 else {
 console.log("Pagedown or one of its dependencies is not available, so markdown will be passed on without any changes.");
 }

 // If we can't evolve the output, we just pass it through.
 return options.fn(this);
 };

 Handlebars.registerHelper('md', templates.mdHelper);

 templates.jsonify = function(context) { return JSON.stringify(context); };

 */

/* Library to add key helper functions to express handlebars */
"use strict";
var fluid     = fluid || require('infusion');
var namespace = "gpii.templates.hb.helpers";
var helpers   = fluid.registerNamespace(namespace);

helpers.md = function(that, context) {
    if (!context) {
    }
    else if (that && that.model && that.model.converter) {
        return that.model.converter.makeHtml(context);
    }
    else {
        console.error("Can't convert markdown content because the converter could not be found");
    }

    // If we can't evolve the output, we just pass it through.
    return context;
};

helpers.jsonify = function(that, context) {
    try {
        return JSON.stringify(context);
    }
    catch (e) {
        console.log("Can't convert JSON object to string: " + e);
        return context;
    }
};

helpers.configureConverter = function(that) {
    if (that.model.converter) {
        // Double all single carriage returns so that they result in new paragraphs, at least for now
        that.model.converter.hooks.chain("preConversion", function (text) { return text.replace(/[\r\n]+/g, "\n\n"); });
    }
    else {
        console.error("Could not initialize pagedown converter.  Markdown content will not be parsed.")
    }
};

fluid.defaults(namespace, {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.helper", "autoInit"],
    model: {
        converter: null,
        helpers: {
            "jsonify": "jsonify",
            "md":      "md"
        }
    },
    invokers: {
        "jsonify": {
            funcName: namespace + ".jsonify",
            args:     ["{that}", "{arguments}.0"]
        },
        "md": {
            funcName: namespace + ".md",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    modelListeners: {
        "converter": {
            funcName: namespace + ".configureConverter",
            excludeSource: "init",
            args: ["{that}"]
        }
    }
});
