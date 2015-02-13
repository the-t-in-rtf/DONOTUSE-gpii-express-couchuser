var testFiles = [
    "./server-tests.js",
    "./zombie-tests.js"
];

testFiles.forEach(function(file){
    require(file);
});

