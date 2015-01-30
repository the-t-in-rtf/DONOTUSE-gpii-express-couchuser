A helper library to assist in pulling in handlebars content both on the server and client side.  Provides two helper functions (see ["functions"](#Functions) below).

# Server-side installation instructions

This is currently an unlisted repository.  To add this library to your server-side dependencies, add it to your package.json file, as in:

```
  ...
  "dependencies": {
    "fluid-handlebars-helper": "git://github.com/the-t-in-rtf/fluid-handlebars-helper.git",
  },
  ...
```

For examples of server-side usage, take a look at the tests in ```src/tests/js/server-tests.js```.

# Client-side installation instructions

To make this available on the client side, add it to your bower dependencies, as in:

```
bower install --save git://github.com/the-t-in-rtf/fluid-handlebars-helper.git
```

For examples of client-side usage, take a look at the tests in ```src/tests/html```.


# Functions

## jsonify

Convert an object into a string representation using JSON.stringify.  To use this function in your handlebars templates, add code like:

```
{{jsonify variable}}
```


## md

Transform markdown into html.  To use this function in your handlebars templates, add code like:

```
{{md variable}}

{{md "string value"}}
```
