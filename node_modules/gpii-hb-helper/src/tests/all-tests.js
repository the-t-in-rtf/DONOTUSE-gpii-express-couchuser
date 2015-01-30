var tests = ["./js/server-tests.js", "./js/zombie-tests.js"];
tests.forEach(function(testFile){
    require(testFile);
});