// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = FileModelFactory;

FileModelFactory.$provide = 'Models.File';
FileModelFactory.$inject = [
    'Model'
];

function FileModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'files',
            attributes: {

                basename: {
                    type: 'string',
                    required: true
                },

                filename: {
                    type: 'string',
                    required: true
                },

                uuid: {
                    type: 'string',
                    required: true,
                    uuidv4: true
                },

                md5: {
                    type: 'string',
                    required: true
                },

                sha256: {
                    type: 'string',
                    required: true
                },

                version: {
                    type: 'integer',
                    defaultsTo: 0
                },

                toJSON: function() {
                    var obj = this.toObject();
                    delete obj.id;
                    delete obj.createdAt;
                    delete obj.updatedAt;
                    return obj;
                }

            }
    });
}
