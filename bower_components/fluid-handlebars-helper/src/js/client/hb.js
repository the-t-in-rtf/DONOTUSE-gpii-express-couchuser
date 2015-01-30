// A client-side template handling library that brings in all Handlebars templates and partials and adds functions for more easily using them.
//
// Requires Handlebars.js and Pagedown (for markdown rendering)

(function ($) {
    "use strict";
    var hb = fluid.registerNamespace("gpii.templates.hb");

    // TODO:  refactor to use the same code on the client and server-side (requires finding a markdown library that works in both)
    hb.md = function(options) {
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
    Handlebars.registerHelper('md', hb.md);

    hb.jsonify = function(context) { return JSON.stringify(context); };
    Handlebars.registerHelper('jsonify', hb.jsonify);

    hb.render = function(that, key, context) {
        // TODO:  Convert to "that-ism" where we use locate() instead of $(selector)
        // If a template exists, load that.  Otherwise, try to load the partial.
        var element = $("#partial-" + key).length ? $("#partial-" + key) : $("#template-" + key);

        // Cache each compiled template the first time we use it...
        if (that.model.compiled[key]) {
            return that.model.compiled[key](context);
        }
        else {
            if (!element || !element.html()) {
                console.log("Template '" + key + "' does not have any content. Skipping");
                return;
            }

            var template = Handlebars.compile(element.html());
            that.model.compiled[key] = template;
            return template(context);
        }
    };

    hb.passthrough = function(that, element, key, context, manipulator) {
        element[manipulator](hb.render(that, key, context));
    };

    ["after","append","before","prepend","replaceWith"].forEach(function(manipulator){
        hb[manipulator] = function(that, element, key, context) {
            hb.passthrough(that, element, key, context, manipulator);
        };
    });

    hb.appendToBody = function (that, data, textStatus, jqXHR) {
        // TODO:  Replace this with a {that} reference?
        $("body").append(data);

        hb.loadPartials();
    };

    hb.loadPartials  = function() {
        // load all partials so that we can use them in context
        $("[id^=partial-]").each(function(index, element) {
            var id = element.id;
            var key = id.substring(id.indexOf("-")+1);
            Handlebars.registerPartial(key,$("#" + id).html());
        });
    };

    hb.loadTemplates = function(that, callback){
        var settings = {
            url:     that.model.templateUrl,
            success: hb.appendToBody
        };
        if (callback) {
            $.ajax(settings).then(callback);
        }
        else {
            $.ajax(settings);
        }
    };

    fluid.defaults("gpii.templates.hb",{
        gradeNames: ["fluid.standardRelayComponent","autoInit"],
        model: {
            compiled:    {},
            templateUrl: "/hbs"
        },
        invokers: {
            "after": {
                funcName: "gpii.templates.hb.after",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "append": {
                funcName: "gpii.templates.hb.append",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "appendToBody": {
                funcName: "gpii.templates.hb.appendToBody",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "before": {
                funcName: "gpii.templates.hb.before",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "body": {
                funcName: "gpii.templates.hb.body",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "jsonify": {
                funcName: "gpii.templates.hb.jsonify"
            },
            "loadPartials": {
                funcName: "gpii.templates.hb.loadPartials"
            },
            "loadTemplates": {
                funcName: "gpii.templates.hb.loadTemplates",
                args: ["{that}", "{arguments}.0"]
            },
            "md": {
                funcName: "gpii.templates.hb.md"
            },
            "prepend": {
                funcName: "gpii.templates.hb.prepend",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "replaceWith": {
                funcName: "gpii.templates.hb.replaceWith",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            }
        }
    });
})(jQuery);


