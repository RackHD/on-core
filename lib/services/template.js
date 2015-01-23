// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di'),
    util = require('util');

module.exports = templateServiceFactory;

di.annotate(templateServiceFactory, new di.Provide('Services.Template'));
di.annotate(templateServiceFactory,
    new di.Inject(
        'FileLoader',
        'Constants',
        'Q',
        'ejs'
    )
);

/**
 * templateServiceFactory provides the template-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {TemplateService}            An instance of the TemplateService.
 */
function templateServiceFactory(FileLoader, Constants, Q, ejs) {
    /**
     * TemplateService is a singleton object which provides key/value store
     * access to template files loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function TemplateService () {
        this.loader = new FileLoader();
    }

    TemplateService.prototype.start = function start() {
        return Q.resolve();
    };

    TemplateService.prototype.stop = function stop() {
        return Q.resolve();
    };

    TemplateService.prototype.get = function (template) {
        return this.loader.get(
            Constants.Templates.Directory + '/' + template
        );
    };

    TemplateService.prototype.getAll = function () {
        return this.loader.getAll(Constants.Templates.Directory);
    };

    TemplateService.prototype.render = function render (template, options) {
        return this.get(template).then(function (contents) {
            return ejs.render(contents, options);
        });
    };

    return new TemplateService();
}
