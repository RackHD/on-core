// Copyright (c) 2015, EMC Corporation
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = profileServiceFactory;

di.annotate(profileServiceFactory, new di.Provide('Profiles'));
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

    ProfileService.prototype.load = function load() {
        var self = this;

        return this.loader.getAll(
            Constants.Profiles.Directory
        ).then(function (profiles) {
            var promises = _.map(profiles, function (contents, name) {
                return self.put(name, contents);
            });

            return Q.all(promises);
        }).catch(function (err) {
            if (process.env.NODE_ENV !== 'test') {
                logger.warning(
                    'Unable to load profiles from ' +
                    Constants.Profiles.Directory + '.',
                    {
                        error: err
                    }
                );
            }
        });
    };

    ProfileService.prototype.put = function (file, contents) {
        return Q.resolve(
            waterline.profiles.findOne({ name: file })
            .then(function(doc) {
                if (!_.isEmpty(doc)) {
                    return waterline.profiles.update(
                        { name: file },
                        { contents :contents }
                    );
                } else {
                    return waterline.profiles.create(
                        {
                            name: file,
                            contents: contents
                        }
                    );
                }
            })
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
