// Copyright 2015, EMC, Inc.

'use strict';

module.exports = templateServiceFactory;

templateServiceFactory.$provide = 'Templates';
templateServiceFactory.$inject = [
    'Constants',
    'Promise',
    '_',
    'DbRenderableContent',
    'Util'
];

/**
 * templateServiceFactory provides the template-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {TemplateService}            An instance of the TemplateService.
 */
function templateServiceFactory(
    Constants, 
    Promise, 
    _, 
    DbRenderable,
    Util ) 
{
    Util.inherits(TemplateService, DbRenderable);

    /**
     * TemplateService is a singleton object which provides key/value store
     * access to template files loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function TemplateService () {
        DbRenderable.call(this, {
            directory: Constants.Templates.Directory,
            collectionName: 'templates'
        });
    }

    return new TemplateService();
}
