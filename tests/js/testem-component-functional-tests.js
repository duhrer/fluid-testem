/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var jqUnit = require("node-jqunit");

var exec   = require("child_process").exec;
var fs     = require("fs");
var rimraf = require("rimraf");

require("../../src/js/lib/pathUtils");
require("../testem-fixtures/coverage-fixtures/package-relative");

fluid.registerNamespace("fluid.tests.testem.runner");

fluid.tests.testem.runner.runAllTests = function (that) {
    jqUnit.module("Testing coverage detection and reporting...");
    fluid.each(that.options.tests, function (testDef) {
        fluid.tests.testem.runner.runSingleTest(that, testDef);
    });
};

fluid.tests.testem.runner.runSingleTest = function (that, testDef) {
    jqUnit.asyncTest(testDef.name, function () {
        var command = fluid.stringTemplate(that.options.commandTemplate, testDef);
        exec(command, {cwd: __dirname }, function (error, stdout, stderr) {
            jqUnit.start();
            if (testDef.expectedErrors) {
                fluid.each(fluid.makeArray(testDef.expectedErrors), function (expectedError) {
                    var hasError = stderr.indexOf(expectedError) !== -1 || stdout.indexOf(expectedError) !== -1;
                    jqUnit.assertTrue("The console should contain the error '" + expectedError + "'...", hasError);
                });
            }
            else if (error) {
                fluid.log("TESTEM ERROR:", error);
                jqUnit.fail("There should be no errors running testem...");
            }

            var matches = stdout.match(/= START TESTEM COMPONENT OPTIONS =\n([^]+)= END TESTEM COMPONENT OPTIONS =\n/);
            jqUnit.assertTrue("There should be component options in the output...", matches && matches[1]);
            if (matches) {
                var testemOptions = JSON.parse(matches[1]);

                if (!testDef.expectedErrors) {
                    var tapReportPath = fluid.testem.resolvePackageOrCwdRelativePath (testemOptions.reportsDir, "report.tap");
                    jqUnit.assertTrue("There should be a TAP report...", fs.existsSync(tapReportPath));

                    var htmlCoveragePath = fluid.testem.resolvePackageOrCwdRelativePath (testemOptions.reportsDir, "index.html");
                    var coverageSummaryPath = fluid.testem.resolvePackageOrCwdRelativePath (testemOptions.reportsDir, "coverage-summary.json");

                    if (testDef.hasCoverage) {
                        jqUnit.assertTrue("There should be an HTML coverage report...", fs.existsSync(htmlCoveragePath));
                        jqUnit.assertTrue("There should be a JSON coverage summary...", fs.existsSync(coverageSummaryPath));

                        var coverageSummary = require(coverageSummaryPath);
                        // We have to force the deep comparison to be limited to one branch of the overall tree.
                        jqUnit.assertLeftHand("The coverage should be as expected...", testDef.expectedCoverage.total, coverageSummary.total);
                    }
                    else {
                        jqUnit.assertFalse("There should not be an HTML coverage report...", fs.existsSync(htmlCoveragePath));
                        jqUnit.assertFalse("There should not be a JSON coverage summary...", fs.existsSync(coverageSummaryPath));
                    }
                }

                // Now that we have inspected the output, clean it up.
                jqUnit.stop();

                var cleanupPromises = [];

                fluid.each([testemOptions.reportsDir, testemOptions.coverageDir], function (dirToRemove) {
                    // Needed to avoid problems with "failure" tests.
                    if (dirToRemove) {
                        cleanupPromises.push(function () {
                            var resolvedPathToRemove = fluid.module.resolvePath(dirToRemove);
                            fluid.log("Removing dir '", resolvedPathToRemove, "'...");
                            return rimraf(resolvedPathToRemove);
                        });
                    }
                });

                var sequence = fluid.promise.sequence(cleanupPromises);
                sequence.then(
                    function () {
                        fluid.log("Removed reports and coverage from this test run...");
                        jqUnit.start();
                    },
                    function (error) {
                        fluid.log("Unable to remove reports and/or coverage from this test run:", error);
                        jqUnit.start();
                    }
                );
            }
            else {
                jqUnit.fail("There should have been testem options in the console logs...");
            }
        });
    });
};

fluid.defaults("fluid.tests.testem.runner", {
    gradeNames: ["fluid.component"],
    commandTemplate: "node ../../node_modules/testem/testem.js ci --file %configFile",
    tests: {
        complete: {
            name: "Running a suite of tests that results in complete coverage...",
            configFile: "../testem-fixtures/coverage-fixtures/testem-complete-coverage.js",
            hasCoverage: true,
            expectedCoverage: {
                total: {
                    branches: {
                        total: 2,
                        covered: 2,
                        skipped: 0,
                        pct: 100
                    }
                }
            }
        },
        incomplete: {
            name: "Running a suite of tests that results in incomplete coverage...",
            configFile: "../testem-fixtures/coverage-fixtures/testem-incomplete-coverage.js",
            hasCoverage: true,
            expectedCoverage: {
                total: {
                    branches: {
                        total: 2,
                        covered: 1,
                        skipped: 0,
                        pct: 50
                    }
                }
            }
        },
        noCoverage: {
            name:        "Running a suite of tests without test coverage...",
            configFile:  "../testem-fixtures/coverage-fixtures/testem-no-coverage.js",
            hasCoverage: false
        },
        packageRelative: {
            name: "Running a suite of tests with package-relative paths...",
            configFile: "../testem-fixtures/coverage-fixtures/testem-package-relative-paths.js",
            hasCoverage: true,
            expectedCoverage: {
                total: {
                    branches: {
                        total: 2,
                        covered: 2,
                        skipped: 0,
                        pct: 100
                    }
                }
            }
        },
        instrumentationTiming: {
            name:       "Confirm that long-running instrumentation does not interfere with coverage collection...",
            configFile: "../testem-fixtures/coverage-fixtures/testem-instrumentation-timing.js",
            hasCoverage: true,
            expectedCoverage: {
                total: {
                    branches: {
                        total: 2,
                        covered: 2,
                        skipped: 0,
                        pct: 100
                    }
                }
            }
        },
        failure: {
            name:          "Running a suite of tests with gross configuration errors...",
            configFile:    "../testem-fixtures/failure-modes/testem-failure-modes.js",
            hasCoverage:   false,
            expectedErrors: [
                "TypeError"
            ]
        }
    },
    listeners: {
        "onCreate.runAllTests": {
            funcName: "fluid.tests.testem.runner.runAllTests",
            args:     ["{that}"]
        }
    }
});
fluid.tests.testem.runner();
