// A front-end component to provide meaningful feedback when users verify their accounts using /api/user/verify/:code
(function ($) {
    "use strict";
    var namespace = "ctr.components.reset";
    var verify     = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    verify.submit = function(that, event) {
        if (event) { event.preventDefault(); }

        if (!that.model || !that.model.code) {
            that.displayError(that, null, null, "<p>Cannot continue without a verification code.  Please check your email for a verification link or contact a system administrator for assistance.</p>")
        }
        else {
            var settings = {
                type:    "POST",
                url:     that.options.apiUrl + "/verify",
                success: that.displayReceipt,
                error:   that.displayError,
                json:    true,
                data: { "code": that.model.code }
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

        templates.prepend(that.locate("form"),"common-error", message);
    };

    verify.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            templates.replaceWith(that.locate("viewport"),"success", {message:"You have successfully reset your password."});
        }
        else {
            templates.prependTo(that.locate("form"),"common-error", jsonData.message);
        }
    };

    verify.refresh = function(that) {
        templates.replaceWith(that.locate("viewport"),"reset-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    verify.init = function(that) {
        templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults(namespace, {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        model: {
            code: null
        },
        apiUrl: "/api/user",
        selectors: {
            "viewport": ".reset-viewport",
            "message":  ".reset-message",
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
            onCreate: {
                "funcName": namespace + ".init",
                "args":     "{that}"
            },
            "markupLoaded": {
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