// Copyright 2015, EMC, Inc.

'use strict';

module.exports = templateServiceFactory;

templateServiceFactory.$provide = 'Templates';
templateServiceFactory.$inject = [
    'FileLoader',
    'Constants',
    'Promise',
    '_',
    'Services.Waterline',
    'Logger',
    'ejs'
];

/**
 * templateServiceFactory provides the template-service singleton object.
 * @private
 * @param  {FileLoader} FileLoader A FileLoader class for extension.
 * @param  {configuration} configuration      An instance of the configuration configuration object.
 * @return {TemplateService}            An instance of the TemplateService.
 */
function templateServiceFactory(FileLoader, Constants, Promise, _, waterline, Logger, ejs) {
    var logger = Logger.initialize(templateServiceFactory);
    /**
     * TemplateService is a singleton object which provides key/value store
     * access to template files loaded from disk via FileLoader.
     * @constructor
     * @extends {FileLoader}
     */
    function TemplateService () {
        this.loader = new FileLoader();
    }

    TemplateService.prototype.load = function load() {
        var self = this;

        return this.loader.getAll(
            Constants.Templates.Directory
        ).then(function (templates) {
            var promises = _.map(templates, function (contents, name) {
                return self.put(name, contents.toString());
            });

            return Promise.all(promises);
        }).catch(function (err) {
            if (process.env.NODE_ENV !== 'test') {
                logger.error(
                    'Unable to load templates from ' + Constants.Templates.Directory + '.',
                    {
                        error: err
                    }
                );
            }
        });
    };

    TemplateService.prototype.put = function (file, contents, scope) {
        scope = scope || 'global';
        return Promise.resolve(
            waterline.templates.findOne({ name: file, scope: scope })
            .then(function(doc) {
                if (!_.isEmpty(doc)) {
                    return waterline.templates.update(
                        { name: file, scope: scope },
                        { contents :contents }
                    );
                } else {
                    return waterline.templates.create(
                        {
                            name: file,
                            contents: contents,
                            scope: scope
                        }
                    );
                }
            })
        );
    };

    TemplateService.prototype.get = function (name, scope) {
        scope = scope || ['global'];

        // The position of the tag defines the scope priority
        var scopeWeight = {}, i = 1;
        _.forEach(scope, function(item) {
            scopeWeight[item] = i;
            i += 1;
        });

        return waterline.templates.find({name: name, scope: scope}).then(function(templates) {
            templates.sort(function(a,b) {
                return scopeWeight[a.scope] - scopeWeight[b.scope];
            });
            return templates[0];
        });
    };

    TemplateService.prototype.getAll = function () {
        return waterline.templates.find();
    };

    TemplateService.prototype.render = function render (name, options, scope) {
        return this.get(name, scope).then(function (template) {
            return ejs.render(template.contents, options);
        });
    };

    return new TemplateService();
}
