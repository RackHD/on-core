// Copyright 2015, EMC, Inc.

'use strict';

module.exports = profileServiceFactory;

profileServiceFactory.$provide = 'Profiles';
profileServiceFactory.$inject = [
    'FileLoader',
    'Constants',
    'Promise',
    '_',
    'Services.Waterline',
    'Logger'
];

/**
 * profileServiceFactory provides the profile-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {ProfileService}            An instance of the ProfileService.
 */
function profileServiceFactory(FileLoader, Constants, Promise, _, waterline, Logger) {
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
                return self.put(name, contents.toString());
            });

            return Promise.all(promises);
        }).catch(function (err) {
            if (process.env.NODE_ENV !== 'test') {
                logger.error(
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
        return Promise.resolve(
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
