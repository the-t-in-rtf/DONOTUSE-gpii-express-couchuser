// Provide a front-end to /api/user/reset
// The second part of the password reset process, can only be used with a code generated using the "forgot password" form.
(function ($) {
    "use strict";
    var namespace = "gpii.express.couchuser.frontend.reset";
    var reset     = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    reset.submit = function(that, event) {
        if (event) { event.preventDefault(); }
        var code     = that.locate("code").val();
        var password = that.locate("password").val();
        var confirm  = that.locate("confirm").val();

        // We can trust the upstream server to bust us if we have an invalid or missing code, but it doesn't support password confirmation, so we have to check that ourselves
        if (password === confirm) {
            var settings = {
                type:    "POST",
                url:     that.options.apiUrl + "/reset",
                success: that.displayReceipt,
                error:   that.displayError,
                json:    true,
                data: { "code": code, "password": password }
            };

            $.ajax(settings);
        }
        // TODO:  Add support for password validation, using a module common to this and the signup form.
        else {
            that.templates.prepend(that.locate("message"),"common-error", "The passwords you entered do not match.");
        }
    };

    // TODO: move this to a general module type that everyone inherits from
    reset.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        that.templates.prepend(that.locate("message"),"common-error", message);
    };

    reset.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            that.templates.replaceWith(that.locate("viewport"),"success", {message:"You have successfully reset your password."});
            that.controls.refresh(that);
        }
        else {
            that.templates.prependTo(that.locate("form"),"common-error", jsonData.message);
        }
    };

    reset.refresh = function(that) {
        that.templates.replaceWith(that.locate("viewport"),"reset-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    reset.init = function(that) {
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
            "form":     ".reset-form",
            "message":  ".reset-message",
            "viewport": ".reset-viewport",
            "code":     "input[name='code']",
            "confirm":  "input[name='confirm']",
            "password": "input[name='password']"
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