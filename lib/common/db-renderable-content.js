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
    'ejs',
    'Assert',
    'crypto',
    'path',
    'Errors'
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
    ejs,
    assert,
    crypto,
    path,
    Errors  )
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

        return self.loader.getAll(self.directory, true)
        .then(function(files) {
            return Promise.map(_.keys(files), function(filename) {
                var name = filename.split('::')[0];
                var scope = filename.split('::')[1];
                return self.loadFile(
                    name,
                    files[filename].path,
                    files[filename].contents,
                    scope
                );
            }).then(function(arr) {
               return  _.compact(arr);
            });
        })
        .catch(function (err) {
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

    function _createOrUpdateRecord(filename, filepath, hash, scope) {
        var self = this;
        scope = scope || Constants.Scope.Global;

        return waterline[self.collectionName].findOne({name: filename, scope: scope})
        .then(function(fileRecord) {
            if (_.isEmpty(fileRecord)) {
                return waterline[self.collectionName].create({
                    name: filename,
                    hash: hash,
                    path: filepath,
                    scope: scope
                });
            } else {
                if (fileRecord.hash !== hash) {
                    fileRecord.hash = hash;
                    fileRecord.path = filepath;
                    return fileRecord.save();
                }
                return fileRecord;
            }
        });
    }

    DbRenderableContentService.prototype.loadFile = function(filename, filepath, content, scope) {
        var self = this;
        return Promise.try(function() {
            return crypto.createHash('md5').update(content).digest('base64');
        })
        .then(function(hash) {
            return _createOrUpdateRecord.call(
                self,
                filename,
                filepath,
                hash,
                scope
            );
        });
    };

    var _updateCollection = function(templateServiceInstance, filepath, content, collectionName, filename, scope, hash){
        return waterline[collectionName].findOne({name: filename,
                path: filepath})
            .then(function(file) {
                if (file && file.scope !== scope) {
                    return filepath + '::' + scope;
                }
                return filepath;
            })
            .then(function(filepath) {
                return Promise.all([
                    templateServiceInstance.loader.put(filepath, content),
                    filepath
                ]);
            })
            .spread(function(file, filepath) {
                return _createOrUpdateRecord.call(
                    templateServiceInstance,
                    filename,
                    filepath,
                    hash.digest('base64'),
                    scope
                );
            })
            .catch(function(error){
                return error;
            });
    };

    DbRenderableContentService.prototype.put = function (filename, stream, scope) {
        var self = this;
        var contents = '';
        var resolve;
        var reject;
        var hash = crypto.createHash('md5');
        var filepath = path.join(self.directory, filename);
        scope = scope || Constants.Scope.Global;

        if(stream.req === undefined){
            var promise = new Promise(function(_resolve, _reject) {
                resolve = _resolve;
                reject = _reject;
            });

            stream.on('data', function(chunk) {
                var chunkStr = chunk.toString('utf-8');
                contents += chunkStr;
                hash.update(chunkStr);
            });

            stream.on('end', function() {
                resolve(
                    _updateCollection(self, filepath, contents, self.collectionName, filename, scope, hash)
                );
            });

            stream.on('error', function(err) {
                reject(new Errors.InternalServerError(err.message));
            });

            return promise;
        }else{
            //The file content is coming from on-http over grpc and it has been streamed already
            hash.update(stream.req);
            return _updateCollection(self, filepath, stream.req, self.collectionName, filename, scope, hash);

        }

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

        return waterline[self.collectionName].find({name: name})
            .then(function(templates) {

                if (!templates.length) { return undefined; }

                templates = templates.filter(function(obj){
                    return scope.indexOf(obj.scope) > -1;
                });

                templates.sort(function(a,b) {
                    return scopeWeight[a.scope] - scopeWeight[b.scope];
                });
                return templates[0];
            })
            .then(function(template) {
                if (!template) { return template; }

                return self.loader.get(template.path)
                .then(function(data) {
                    return Promise.all([
                        crypto.createHash('md5').update(data).digest('base64'),
                        data
                    ]);
                })
                .spread(function(hash, data) {
                    if (template.hash !== hash) {
                        throw new Errors.InternalServerError(
                            'template hash mismatch for ' + name + ' in ' + scope + ' scope'
                        );
                    }
                    return _.merge({}, template, {contents: data});
                });
            });
    };

    DbRenderableContentService.prototype.getAll = function () {
        return waterline[this.collectionName].find();
    };

    DbRenderableContentService.prototype.getName = function (name, scope) {
        return waterline[this.collectionName].find({name: name})
        .then(function(meta) {
            if (!meta.length) {
                throw new Errors.NotFoundError('Template ' + name + ' does not exist');
            }
            if (scope) {
                return _(meta).filter(function(o) {return o.scope === scope;}).value();
            }
            return meta;
        });
    };

    DbRenderableContentService.prototype.render = function render (name, options, scope) {
        return this.get(name, scope).then(function (template) {
            assert.ok(template && template.contents, name + ' is not a valid template');
            return ejs.render(template.contents, options);
        });
    };

    DbRenderableContentService.prototype.unlink = function (name, scope) {
        var self = this;
        scope = scope || Constants.Scope.Global;
        return waterline[this.collectionName].findOne({name: name, scope: scope})
        .then(function(record) {
            if (!record) {
                throw new Errors.NotFoundError('template ' + name  + ' does not exist in ' + scope);
            }
            return self.loader.unlink(record.path);
        })
        .then(function() {
            return waterline[self.collectionName].destroy({name: name, scope: scope});
        })
        .then(function(templates) {
            return _.first(templates);
        });
    };

    return DbRenderableContentService;
}
