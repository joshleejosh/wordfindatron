var Jasmine = require('jasmine');
var JasmineConsoleReporter = require('jasmine-console-reporter');

var runner = new Jasmine();
runner.loadConfig({
    "spec_dir": "tests",
    "spec_files": [
        "**/*[sS]pec.js"
    ],
    "helpers": [
        "helpers/**/*.js"
    ],
    "stopSpecOnExpectationFailure": false,
    "random": false
});

runner.addReporter(new JasmineConsoleReporter({ verbosity: 3 }));
runner.execute();

