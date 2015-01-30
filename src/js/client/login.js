// provide a front-end to /api/user/signin
(function ($) {
    "use strict";
    var namespace   = "gpii.express.couchuser.frontend.login";
    var login       = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    login.submit = function(that, event) {
        // Clear out any previous feedback before submitting
        $(that.container).find(".alert-box").remove();

        if (event) { event.preventDefault(); }
        var name     = that.locate("name").val();
        var password = that.locate("password").val();
        var settings = {
            type:    "POST",
            url:     that.options.loginUrl,
            data:    JSON.stringify({ "name": name, "password": password }),
            success: that.displayReceipt,
            error:   that.displayError
        };

        $.ajax(settings);
    };

    login.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        that.templates.prepend(that.locate("form"), that.model.templates.error, message);
    };

    login.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            that.templates.replaceWith(that.locate("viewport"), that.model.templates.form, that.model.data);
            that.controls.refresh(that);
        }
        else {
            templates.prependTo(that.locate("form"), that.model.templates.error, jsonData.message);
        }
    };

    login.refresh = function(that) {
        that.templates.replaceWith(that.locate("viewport"), that.options.templates.form, that.model.data);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    login.init = function(that) {
        that.templates.loadTemplates();
        that.events.markupLoaded.fire();
    };


    // You are required to provide an instance of {gpii.data} before instantiating this
    fluid.defaults(namespace, {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            templates: {
                "type": "gpii.templates.hb.client"
            },
            data:     { type: "gpii.data" }
        },
        model: {
            "data": "{data}.model",
            "templates": {
                "error":   "common-error",
                "success": "common-success",
                "form":    "login-form"
            }
        },
        loginUrl: "/api/user/signin",
        selectors: {
            "form":     ".login-form",
            "viewport": ".login-viewport",
            "name":     "input[name='username']",
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