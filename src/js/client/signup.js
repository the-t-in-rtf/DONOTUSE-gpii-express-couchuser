// provide a front-end to /api/user/signup
(function ($) {
    "use strict";
    var namespace = "gpii.express.couchuser.frontend.signup";
    var signup    = fluid.registerNamespace(namespace);

    // Try to log in and display the results
    signup.submit = function(that, event) {
        if (event) { event.preventDefault(); }
        var name     = that.locate("name").val();
        var email    = that.locate("email").val();
        var password = that.locate("password").val();
        var confirm  = that.locate("confirm").val();

        // Our user handling library doesn't offer password confirmation, so we have to do it ourselves for now
        if (password !== confirm) {
            signup.displayError(that, null, null, "The passwords you have entered don't match.");
            return;
        }

        var settings = {
            type:        "POST",
            url:         that.options.apiUrl + "/signup",
            success:     that.displayReceipt,
            error:       that.displayError,
            data:        { name: name, "password": password, "email": email, "roles": ["user"] }
        };

        $.ajax(settings);
    };

    signup.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        that.templates.replaceWith(that.locate("message"),"common-error",message);
    };

    signup.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);
            that.locate("form").hide();

            that.templates.replaceWith(that.locate("message"),"success", {message:"You have created an account. Check your email for details about verifying your new account."});
        }
        else {
            that.templates.replaceWith(that.locate("message"),"common-error", jsonData.message);
        }
    };

    signup.refresh = function(that) {
        that.templates.replaceWith(that.locate("form"),"signup-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    signup.init = function(that) {
        that.templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults(namespace, {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        apiUrl: "/api/user",
        components: {
            templates: {
                "type": "gpii.templates.hb.client"
            }
        },
        selectors: {
            "form":     ".signup-form",
            "viewport": ".signup-viewport",
            "message":  ".signup-message",
            "name":     "input[name='username']",
            "email":    "input[name='email']",
            "password": "input[name='password']",
            "confirm":  "input[name='confirm']"
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
                funcName: namespace + ".loadTemplates"
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