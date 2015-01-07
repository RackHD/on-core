// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di'),
    util = require('util');

module.exports = profileServiceFactory;

di.annotate(profileServiceFactory, new di.Provide('Services.Profile'));
di.annotate(profileServiceFactory,
    new di.Inject(
        'FileLoader',
        'Services.Configuration'
    )
);

/**
 * profileServiceFactory provides the profile-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration An instance of the configuration configuration object.
 * @return {ProfileService} An instance of the ProfileService.
 */
function profileServiceFactory(FileLoader, configuration) {
    /**
     * ProfileService is a singleton object which provides key/value store
     * access to iPXE profiles loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function ProfileService () {
        FileLoader.call(this);

        this.load(
            configuration.get('baseDirectory') + "/extensions/**/profiles/**/*"
        ).done();
    }

    util.inherits(ProfileService, FileLoader);

    return new ProfileService();
}
