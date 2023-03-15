# `fluid.testem`

This library provides a [Fluid
component](http://docs.fluidproject.org/infusion/development/UnderstandingInfusionComponents.html) and static functions
that assist in using [Testem](https://github.com/testem/testem).

## Key Features

1. Provides a mechanism to collect client-side code coverage data and combine that with browser coverage.
2. Provides the ability to launch and wait for server-side components to start up before each test run.
3. Provides the ability to safely shut down server-side test fixtures after each test run.
4. Provides cleanup mechanisms to remove temporary browser content after each test run.

## Usage instructions

To use this grade from Testem, install this package as a development dependency using a command like
`npm install --save-dev fluid-testem`.  Note:  There is currently
[a bug in newer versions of Testem](https://github.com/testem/testem/issues/1075), if you use anything higher than
version 1.13.0, you may experience hangs when attempting to quit Testem from the console.

Once you have Testem installed, you will need to create a javascript configuration file, which will allow you to make
use of the [dynamic configuration options available via the `testem.js`
file](https://github.com/testem/testem/blob/master/examples/dynamic_config/testem.js).

The most basic example of a file might look something like:

```javascript
var fluid = require("infusion");
fluid.require("%fluid-testem");

var my  = fluid.registerNamespace("my");
fluid.defaults("my.testem.grade", {
    gradeNames: ["fluid.testem"],
    testPages:  ["tests/my-awesome-test.html"]
});

module.exports = my.testem.grade().getTestemOptions();
```

To make use of the code coverage support provided by fluid.testem, you must load the "coverage sender" in your HTML
fixtures.  See [the coverage docs](docs/coverage.md) for details.

Once you have created your configuration javascript file, you can launch Testem with your configuration.

### Browser Coverage Only

If you only want to check the coverage of browser code, you can run your tests using a command like the following:

`node node_modules/testem/testem.js ci --file path/to/your-testem-config.js`

If you save your configuration to the file name `testem.js` in your package root, you can launch Testem using a command
like `node node_modules/testem/testem.js` or `node node_modules/testem/testem.js ci`.

### Browser and Node Coverage

If you are testing browser code in combination with node code, please see the example in the
[Testem component docs](docs/testem-component.md).

## More Information

For more information, check out the documentation links below:

* [The `fluid.testem` Component](docs/testem-component.md)
* [The Testem Lifecycle](docs/testem-lifecycle.md)
* [Code Coverage](docs/coverage.md)

## Running the Tests in this Package

You can run the tests using the command `npm test`.  You are not required to have Testem installed globally to run the
tests.

## Running the tests in "Headless" Mode

The default testem component provided by this package supports an environment variable that can be used to only run
tests in a subset of available browsers. (See [the component documentation](docs/testem-component.md) for more details).
Setting the `TESTEM_ENVIRONMENT` environment variable to `"headless"` will run tests using only headless Chrome and
Firefox.

Note: because of [a bug in Testem](https://github.com/testem/testem/issues/1377), tests that use Firefox require manual
input to complete on Windows.  Setting the `TESTEM_ENVIRONMENT` environment variable to `"headless"` will allow tests to
run unattended on Windows.
