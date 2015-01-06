// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    fs = require('fs');

module.exports = nconfServiceFactory;

di.annotate(nconfServiceFactory, new di.Provide('Services.Configuration'));
di.annotate(nconfServiceFactory,
    new di.Inject(
        'nconf'
    )
);

function nconfServiceFactory(nconf) {
    var defaults = process.cwd() + '/config.json',
        overrides = process.cwd() + '/overrides.json';

    nconf.use('memory')
        .argv()
        .env()
        .defaults(require(defaults));

    if (fs.existsSync(overrides)) {
        nconf.defaults(require(overrides));
    }

    return nconf;
}