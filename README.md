# Renasar Core Library

## Directory Structure

###lib/models
Waterline Models

###lib/protocol
Protocol Objects based on Messaging Service

###lib/scheduler
Scheduler Objects

###lib/services
Standard Service Objects

## Development Notes

Run `grunt watch` to have grunt listen for file changes and run the specs and linter automatically.  Grunt is
configured to use the grunt-notify plugin so it will also provide desktop notifications for test results.

## installation

    rm -rf node_modules
    npm install

## CI/testing

To run tests from a developer console:

    npm test

To run tests and get coverage for CI:

    # verify hint/style
    ./node_modules/.bin/jshint -c .jshintrc --reporter=checkstyle lib index.js > checkstyle-result.xml || true
    ./node_modules/.bin/istanbul cover -x "**/spec/**" _mocha -- $(find spec -name '*-spec.js') -R xunit-file --require spec/helper.js
    ./node_modules/.bin/istanbul report cobertura
    # if you want HTML reports locally
    ./node_modules/.bin/istanbul report html
