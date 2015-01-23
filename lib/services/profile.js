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
        'ejs'
    )
);

/**
 * profileServiceFactory provides the profile-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration An instance of the configuration configuration object.
 * @return {ProfileService} An instance of the ProfileService.
 */
function profileServiceFactory(FileLoader, Constants, Q, ejs) {
    function ProfileService () {
        this.loader = new FileLoader();
    }

    ProfileService.prototype.start = function start() {
        return Q.resolve();
    };

    ProfileService.prototype.stop = function stop() {
        return Q.resolve();
    };

    ProfileService.prototype.put = function (file, contents) {
        return this.loader.put(
            Constants.Profiles.Directory + '/' + file,
            contents
        );
    };

    ProfileService.prototype.get = function (profile) {
        return this.loader.get(
            Constants.Profiles.Directory + '/' + profile
        );
    };

    ProfileService.prototype.getAll = function () {
        return this.loader.getAll(
            Constants.Profiles.Directory
        );
    };

    ProfileService.prototype.render = function render (profile, options) {
        return this.get(profile).then(function (contents) {
            return ejs.render(contents, options);
        });
    };

    return new ProfileService();
}
