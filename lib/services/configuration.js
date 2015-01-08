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

    nconf.use('memory');

    if (fs.existsSync(overrides)) {
        nconf.file('overrides', overrides);
    }

    nconf.argv()
        .env()
        .file('config', defaults);

    return nconf;
}
