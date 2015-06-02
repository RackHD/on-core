// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = templateServiceFactory;

templateServiceFactory.$provide = 'Templates';
templateServiceFactory.$inject = [
    'FileLoader',
    'Constants',
    'Q',
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
function templateServiceFactory(FileLoader, Constants, Q, _, waterline, Logger, ejs) {
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
                return self.put(name, contents);
            });

            return Q.all(promises);
        }).catch(function (err) {
            if (process.env.NODE_ENV !== 'test') {
                logger.warning(
                    'Unable to load templates from ' + Constants.Templates.Directory + '.',
                    {
                        error: err
                    }
                );
            }
        });
    };

    TemplateService.prototype.put = function (file, contents) {
        return Q.resolve(
            waterline.templates.findOne({ name: file })
            .then(function(doc) {
                if (!_.isEmpty(doc)) {
                    return waterline.templates.update(
                        { name: file },
                        { contents :contents }
                    );
                } else {
                    return waterline.templates.create(
                        {
                            name: file,
                            contents: contents
                        }
                    );
                }
            })
        );
    };

    TemplateService.prototype.get = function (name) {
        return waterline.templates.findOne({ name: name });
    };

    TemplateService.prototype.getAll = function () {
        return waterline.templates.find();
    };

    TemplateService.prototype.render = function render (name, options) {
        return this.get(name).then(function (template) {
            return ejs.render(template.contents, options);
        });
    };

    return new TemplateService();
}
