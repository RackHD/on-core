// Copyright 2015, EMC, Inc.

'use strict';

module.exports = profileServiceFactory;

profileServiceFactory.$provide = 'Profiles';
profileServiceFactory.$inject = [
    'Constants',
    'Promise',
    '_',
    'DbRenderableContent',
    'Util'
];

/**
 * profileServiceFactory provides the profile-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {ProfileService}            An instance of the ProfileService.
 */
function profileServiceFactory(
    Constants, 
    Promise, 
    _, 
    DbRenderable,
    Util ) 
{
    Util.inherits(ProfileService, DbRenderable);

    /**
     * ProfileService is a singleton object which provides key/value store
     * access to profile files loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function ProfileService () {
        DbRenderable.call(this, {
            directory: Constants.Profiles.Directory,
            collectionName: 'profiles'
        });
    }

    ProfileService.prototype.get = function (name, raw, scope ) {
        return ProfileService.super_.prototype.get.call(this, name, scope)
            .then(function(profile) {
                if (profile && raw) {
                    return profile.contents;
                } else {
                    return profile;
                }
            });
    };

    return new ProfileService();
}
