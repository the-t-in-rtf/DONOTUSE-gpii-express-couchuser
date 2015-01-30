This package provides a series of fluid components that provide a front end to [express-couchuser](https://github.com/twilson63/express-couchUser).  It is intended to be deployed into a working front-end using [bower](bower.io).

# Client-side Installation

This is an unlisted project, but you can still add it to your client-side project using bower using a command like:

```
bower install --save git://github.com/the-t-in-rtf/gpii-express-couchuser-frontend/
```

The tests included in ``src/tests`` give an example of how to configure and instantiate each of the modules.

# Server side configuration

These modules are designed to interact with a working couchdb instance using express-couchuser.

For a full example of how this is configured with express and pouchdb, read through the tests in ```src/tests```.

# Templates

This module expects to update the display using handlebars templates.  These are configurable through the module's options, as demonstrated in the tests.