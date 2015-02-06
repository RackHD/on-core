// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = profileServiceFactory;

di.annotate(profileServiceFactory, new di.Provide('Services.Profile'));
di.annotate(profileServiceFactory,
    new di.Inject(
        'FileLoader',
        'Constants',
        'Q',
        '_',
        'Services.Waterline',
        'Logger'
    )
);

/**
 * profileServiceFactory provides the profile-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {ProfileService}            An instance of the ProfileService.
 */
function profileServiceFactory(FileLoader, Constants, Q, _, waterline, Logger) {
    var logger = Logger.initialize(profileServiceFactory);
    /**
     * ProfileService is a singleton object which provides key/value store
     * access to profile files loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function ProfileService () {
        this.loader = new FileLoader();
    }

    ProfileService.prototype.start = function start() {
        return this.loader.getAll(
            Constants.Profiles.Directory
        ).then(function (profiles) {
            var promises = _.forIn(profiles, function (contents, name) {
                return waterline.profiles.findOrCreate(
                    { name: name },
                    { name: name, contents: contents }
                );
            });

            return Q.all(promises);
        }).catch(function () {
            if (process.env.NODE_ENV !== 'test') {
                logger.warning(
                    'Unable to load profiles from ' +
                    Constants.Profiles.Directory + '.'
                );
            }
        });
    };

    ProfileService.prototype.stop = function stop() {
        return Q.resolve();
    };

    ProfileService.prototype.put = function (file, contents) {
        return waterline.profiles.findOrCreate(
            { name: file },
            {
                name: file,
                contents: contents
            }
        );
    };

    ProfileService.prototype.get = function (name, raw) {
        return waterline.profiles.findOne({ name: name }).then(function (profile) {
            if (profile && raw) {
                return profile.contents;
            } else {
                return profile;
            }
        });
    };

    ProfileService.prototype.getAll = function () {
        return waterline.profiles.find();
    };

    return new ProfileService();
}
