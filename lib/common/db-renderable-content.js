// Copyright 2016, EMC, Inc.

'use strict';

module.exports = dbRenderableContentServiceFactory;

dbRenderableContentServiceFactory.$provide = 'DbRenderableContent';
dbRenderableContentServiceFactory.$inject = [
    'FileLoader',
    'Constants',
    'Promise',
    '_',
    'Services.Waterline',
    'Logger',
    'ejs'
];

/**
 * dbRenderableContentServiceFactory provides the template-service singleton object.
 * @private
 * @param  {Object} FileLoader A FileLoader class for extension.
 * @param  {Object} configuration      An instance of the configuration configuration object.
 * @param  {Object} Promise The Promise library, such as bluebird
 * @param  {Object} _ Lodash
 * @param  {Object} Waterline The ORM
 * @param  {Object} Logger The logging class
 * @param  {Object} EJS A template rendering engine
 */
function dbRenderableContentServiceFactory(
    FileLoader, 
    Constants, 
    Promise, 
    _, 
    waterline, 
    Logger, 
    ejs ) 
{
    var logger = Logger.initialize(dbRenderableContentServiceFactory);

    function DbRenderableContentService (options) {
        options = options || {};
        this.loader = new FileLoader();
        this.collectionName = options.collectionName;
        this.directory = options.directory;
    }

    DbRenderableContentService.prototype.load = function load() {
        var self = this;

        return this.loader.getAll(
            self.directory
        ).then(function (templates) {
            var promises = _.map(templates, function (contents, name) {
                return self.put(name, contents.toString());
            });

            return Promise.all(promises);
        }).catch(function (err) {
            if (process.env.NODE_ENV !== 'test') {
                logger.error(
                    'Unable to load ' + self.collectionName + ' from ' + self.directory + '.',
                    {
                        error: err
                    }
                );
            }
        });
    };

    DbRenderableContentService.prototype.put = function (file, contents, scope) {
        var self = this;
        scope = scope || Constants.Scope.Global;
        return waterline[self.collectionName].findOne({ name: file, scope: scope })
            .then(function(doc) {
                if (!_.isEmpty(doc)) {
                    return waterline[self.collectionName].update(
                        { name: file, scope: scope },
                        { contents :contents }
                    );
                } else {
                    return waterline[self.collectionName].create(
                        {
                            name: file,
                            contents: contents,
                            scope: scope
                        }
                    );
                }
            });
    };

    /**
     * Retrieves a document based on priority order defined in the scope array
     */
    DbRenderableContentService.prototype.get = function (name, scope) {
        var self = this;
        scope = scope || [ Constants.Scope.Global ];

        // The position of the tag defines the scope priority
        var scopeWeight = {}, i = 1;
        _.forEach(scope, function(item) {
            scopeWeight[item] = i;
            i += 1;
        });

        return waterline[self.collectionName].find({name: name, scope: scope})
            .then(function(templates) {
                templates.sort(function(a,b) {
                    return scopeWeight[a.scope] - scopeWeight[b.scope];
                });
                return templates[0];
            });
    };

    DbRenderableContentService.prototype.getAll = function () {
        return waterline[this.collectionName].find();
    };

    DbRenderableContentService.prototype.render = function render (name, options, scope) {
        return this.get(name, scope).then(function (template) {
            return ejs.render(template.contents, options);
        });
    };

    DbRenderableContentService.prototype.unlink = function (name, scope) {
        scope = scope || Constants.Scope.Global;
        return waterline[this.collectionName].destroy({name: name, scope: scope});
    };

    return DbRenderableContentService;
}
