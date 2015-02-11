// Test all user management functions using only a browser (and something to receive emails).
//
// There is some overlap between these and the server-tests.js, a test that fails in both is likely broken on the server side, a test that only fails here is likely broken in the client-facing code.

"use strict";
var scripts = [
    "./zombies/zombie-login.js",
    "./zombies/zombie-signup.js",
    "./zombies/zombie-forgot.js"
];

scripts.forEach(function(script){
    require(script);
});

