// Provide a front-end to /api/user/forgot
// Allows users to request that their password be reset...

(function ($) {
    "use strict";
    var namespace = "gpii.express.couchuser.frontend.forgot";
    var forgot    = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    forgot.submit = function(that, event) {
        if (event) { event.preventDefault(); }
        var email    = that.locate("email").val();
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/forgot",
            success: that.displayReceipt,
            error:   that.displayError,
            data: { "email": email }
        };

        $.ajax(settings);
    };

    forgot.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        that.templates.replaceWith(that.locate("message"),"common-error", message);
    };

    forgot.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            that.locate("form").hide();

            that.templates.replaceWith(that.locate("message"),"success", {message:"Check your email for instructions about resetting your password."});
        }
        else {
            that.templates.replaceWith(that.locate("message"),"common-error", jsonData.message);
        }
    };

    forgot.refresh = function(that) {
        that.templates.replaceWith(that.locate("form"),"forgot-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    forgot.init = function(that) {
        that.templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults(namespace, {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            templates: {
                "type": "gpii.templates.hb.client"
            }
        },
        apiUrl: "/api/user",
        selectors: {
            "form":     ".forgot-form",
            "message":  ".forgot-message",
            "viewport": ".forgot-viewport",
            "email":    "input[name='email']"
        },
        events: {
            "submit":       "preventable",
            "refresh":      "preventable",
            "markupLoaded": "preventable"
        },
        invokers: {
            "submit": {
                funcName: namespace + ".submit",
                args: [ "{that}", "{arguments}.0"]
            },
            "displayError": {
                funcName: namespace + ".displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayReceipt": {
                funcName: namespace + ".displayReceipt",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "init": {
                funcName: "{templates}.loadTemplates"
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": namespace + ".init",
                    "args":     "{that}"
                }
            ],
            "markupLoaded": [
                {
                    "this": "{that}.dom.form",
                    method: "submit",
                    args:   "{that}.submit"
                }
            ],
            "submit": {
                func: namespace + ".submit",
                args: [ "{that}"]
            },
            "refresh": {
                func: namespace + ".refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);