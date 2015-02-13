// A front-end component to provide meaningful feedback when users verify their accounts using /api/user/verify/:code
(function ($) {
    "use strict";
    var namespace = "gpii.express.couchuser.frontend.verify";
    var verify     = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    verify.submit = function(that, event) {
        if (event) { event.preventDefault(); }

        if (!that.model || !that.model.code) {
            that.displayError(null, null, "<p>Cannot continue without a verification code.  Please check your email for a verification link or contact a system administrator for assistance.</p>");
            return;
        }
        else {
            var settings = {
                type:    "GET",
                url:     that.options.apiUrl + "/verify/" + that.model.code,
                success: that.displayReceipt,
                error:   that.displayError
            };

            $.ajax(settings);
        }
    };

    // TODO: move this to a general module type that everyone inherits from
    verify.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        that.templates.html(that.locate("message"),"common-error", { message: message } );
    };

    verify.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            that.templates.html(that.locate("message"), "common-success", { message: "You have successfully verified your account." });
        }
        else {
            that.templates.html(that.locate("message"), "common-error", { message: jsonData.message });
        }
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    verify.init = function(that) {
        that.templates.loadTemplates();
    };

    fluid.defaults(namespace, {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        model: {
            code: null
        },
        components: {
            templates: {
                "type": "gpii.templates.hb.client"
            }
        },
        apiUrl: "/api/user",
        selectors: {
            "viewport": ".verify-viewport",
            "message":  ".verify-message"
        },
        events: {
            "submit":       "preventable",
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
            onCreate: {
                "funcName": namespace + ".init",
                "args":     "{that}"
            },
            "{templates}.events.templatesLoaded": {
                "funcName": namespace + ".submit",
                "args":     "{that}"
            }
        }
    });
})(jQuery);