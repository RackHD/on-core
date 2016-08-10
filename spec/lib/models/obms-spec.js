// Copyright 2016, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.Obms', function () {
    var obms;
    var nodes;
    var encryption;
    var Constants;
    var waterline;
    var eventProtocol;

    helper.before(function (context) {
        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };

        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger')
        ];
    });

    base.before(function (context) {
        obms = context.model = helper.injector.get('Services.Waterline').obms;
        waterline = helper.injector.get('Services.Waterline');
        eventProtocol = helper.injector.get('Protocol.Events');
        nodes = waterline.nodes;
        context.attributes = context.model._attributes;
    });

    helper.after();

    before(function() {
        encryption = helper.injector.get('Services.Encryption');
        Constants = helper.injector.get('Constants');
        return obms.setIndexes();
    });

    beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        this.sandbox.restore();
    });

    describe('Base', function () {
        base.examples();
    });

    describe('create', function() {
        beforeEach(function() {
            return helper.reset();
        });

        it('should create an ipmi obm', function() {
            return obms.create({
                node: 'a node',
                service: 'ipmi-obm-service',
                config: {
                    host: 'some-host',
                    user: 'some-user',
                    password: 'some-password'
                }
            }).then(function(item) {
                expect(item.config.password).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(item.config.password)).to.equal('some-password');
            });
        });

        it('should create an snmp obm', function() {
            return obms.create({
                node: 'a node',
                service: 'snmp-obm-service',
                config: {
                    host: 'some-host',
                    user: 'some-user',
                    community: 'some-community'
                }
            }).then(function(item) {
                expect(item.config.community).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(item.config.community)).to.equal('some-community');
            });
        });

        it('should not create a duplicate obm', function() {
            return obms.create({
                node: '1213',
                service: 'ipmi-obm-service',
                config: {
                    host: 'some-host',
                    user: 'some-user',
                    password: 'some-password'
                }
            }).then(function() {
                return obms.create({
                    node: '1213',
                    service: 'ipmi-obm-service',
                    config: {
                        host: 'some-host',
                        user: 'some-user',
                        password: 'some-password'
                    }
                }).should.be.rejected;
            });
        });
    });

    describe('read', function() {
        var nodeId;
        var testObms = [
            {
                service: 'ipmi-obm-service',
                config: {
                    host: 'some-ipmi-host',
                    user: 'some-ipmi-user',
                    password: 'some-ipmi-password'
                }
            },
            {
                service: 'snmp-obm-service',
                config: {
                    host: 'some-snmp-host',
                    user: 'some-snmp-user',
                    community: 'some-snmp-community'
                }
            }
        ];

        beforeEach(function() {
            return  helper.reset().then(function() {
                return nodes.create({name: 'a node'});
            })
            .then(function(node) {
                nodeId = node.id;
                return Promise.map(testObms, function(obm) {
                    return obms.upsertByNode(node.id, obm);
                });
            });
        });

        it('should get ipmi obm using findOne', function() {
            return obms.findOne({service: 'ipmi-obm-service'})
            .then(function(item) {
                expect(item.config.password).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(item.config.password)).to.equal('some-ipmi-password');
            });
        });

        it('should get snmp obm using findOne', function() {
            return obms.findOne({service: 'snmp-obm-service'})
            .then(function(item) {
                expect(item.config.community).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(item.config.community)).to.equal('some-snmp-community');
            });
        });

        it('should not reveal passwords', function() {
            return obms.findOne({service: 'ipmi-obm-service'})
            .then(function(item) {
                expect(item.toJSON().config).not.to.have.property('password');
            });
        });

        it('should find ipmi-obm-service by node', function() {
            return obms.findByNode(nodeId, 'ipmi-obm-service')
            .then(function(obm) {
                expect(obm.node).to.equal(nodeId);
                expect(obm.config.host).to.equal(testObms[0].config.host);
                expect(obm.config).to.have.property('password');
            });
        });

        it('should find snmp-obm-service by node', function() {
            return obms.findByNode(nodeId, 'snmp-obm-service')
            .then(function(obm) {
                expect(obm.node).to.equal(nodeId);
                expect(obm.config.host).to.equal(testObms[1].config.host);
                expect(obm.config).to.have.property('community');
            });
        });

        it('should find ipmi-obm-service by node', function() {
            return obms.findByNode(nodeId, 'ipmi-obm-service', true)
            .then(function(obm) {
                expect(obm.node).to.equal(nodeId);
                expect(obm.config.host).to.deep.equal(testObms[0].config.host);
            });
        });

        it('should find snmp-obm-service by node', function() {
            return obms.findByNode(nodeId, 'snmp-obm-service', true)
            .then(function(obm) {
                expect(obm.node).to.equal(nodeId);
                expect(obm.config.host).to.deep.equal(testObms[1].config.host);
            });
        });

        it('should not find by non-existent node', function() {
            return obms.findByNode('foo', 'snmp-obm-service')
            .then(function(obm) {
                expect(obm).to.be.undefined;
            });
        });

        it('should not find by non-existent service', function() {
            return obms.findByNode(nodeId, 'foo-obm-service')
            .then(function(obm) {
                expect(obm).to.be.undefined;
            });
        });
    });

    describe('update', function() {
        var testObms = [
            {
                node: '1234',
                service: 'ipmi-obm-service',
                config: {
                    host: 'some-ipmi-host',
                    user: 'some-ipmi-user',
                    password: 'some-ipmi-password'
                }
            },
            {
                node: '1234',
                service: 'snmp-obm-service',
                config: {
                    host: 'some-snmp-host',
                    user: 'some-snmp-user',
                    community: 'some-snmp-community'
                }
            }
        ];

        beforeEach(function() {
            return  helper.reset().then(function() {
                return obms.create(testObms);
            });
        });

        it('should update an obm', function() {
            return obms.update({service: 'ipmi-obm-service'}, {service: 'updated-obm-service'})
            .then(function(items) {
                expect(items).to.be.an('array');
                expect(items).to.have.length(1);
                expect(items[0].service).to.equal('updated-obm-service');
            });
        });

        it('should update an obm password', function() {
            return obms.update({service: 'ipmi-obm-service'}, { config: { password: 'updated-password' } })
            .then(function(items) {
                expect(items).to.be.an('array');
                expect(items).to.have.length(1);
                expect(items[0].config.password).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(items[0].config.password)).to.equal('updated-password');
            });
        });

        it('should save an obm', function() {
            return obms.findOne({ service: 'ipmi-obm-service' })
            .then(function(item) {
                item.config.password = 'saved-password';
                return item.save();
            })
            .then(function(item) {
                expect(item.config.password).to.match(Constants.Regex.Encrypted);
                expect(encryption.decrypt(item.config.password)).to.equal('saved-password');
            });
        });
    });

    describe('upsert' , function() {
        beforeEach(function() {
            return helper.reset();
        });

        it('should create or update an obm', function() {
            var oldNode = { id: 'aaa', obms: [ { service: 'snmp-obm-service' } ]};
            var newNode = { id: 'aaa', obms: [ { service: 'ipmi-obm-service' } ]};
            this.sandbox.stub(eventProtocol, 'publishNodeAttrEvent').resolves();
            this.sandbox.stub(waterline.nodes, 'getNodeById').resolves();
            waterline.nodes.getNodeById.onCall(0).resolves(oldNode);
            waterline.nodes.getNodeById.onCall(1).resolves(newNode);

            return nodes.create({name: 'a node'})
            .then(function(node) {
               var deferredObm = obms.upsertByNode(node.id, {
                    service: 'ipmi-obm-service',
                    config: {
                        host: 'ipmi-host',
                        user: 'ipmi-user',
                        password: 'ipmi-password'
                    }
                });
                return Promise.all([deferredObm, node]);
            })
            .spread(function(obm, node) {
                expect(obm.node).to.equal(node.id);
                expect(obm.config.host).to.equal('ipmi-host');
                expect(obm.config.user).to.equal('ipmi-user');
                var deferredObm = obms.upsertByNode(node.id, {
                    service: 'ipmi-obm-service',
                    config: {
                        host: 'another-ipmi-host',
                        user: 'another-ipmi-user',
                        password: 'ipmi-password'
                    }
                });
                return Promise.all([deferredObm, node, obm.id]);
            })
            .spread(function(obm, node, obmId) {
                expect(obm.node).to.equal(node.id);
                expect(obm.id).to.equal(obmId);
                expect(obm.config.host).to.equal('another-ipmi-host');
                expect(obm.config.user).to.equal('another-ipmi-user');
                expect(eventProtocol.publishNodeAttrEvent).to.have.been.calledWith(
                    oldNode, newNode, 'obms');
                return obms.count();
            })
            .then(function(count) {
                expect(count).to.equal(1);
            });
        });

        it('should reveal secrets', function() {
            var node = { id: 'aaa', obms: [ { service: 'snmp-obm-service' } ]};
            this.sandbox.stub(eventProtocol, 'publishNodeAttrEvent').resolves();
            this.sandbox.stub(waterline.nodes, 'getNodeById').resolves();
            waterline.nodes.getNodeById.resolves(node);

            return nodes.create({name: 'a node'})
            .then(function(node) {
               return obms.upsertByNode(
                    node.id,
                    {
                       service: 'ipmi-obm-service',
                       config: {
                           host: 'ipmi-host',
                           user: 'ipmi-user',
                           password: 'ipmi-password'
                       }
                    },
                    { revealSecrets: true }
                );
            })
            .then(function(obm) {
                expect(obm.config).to.have.property('password')
                    .that.equals('ipmi-password');
            });
        });

        it('should not reveal secrets', function() {
            var node = { id: 'aaa', obms: [ { service: 'snmp-obm-service' } ]};
            this.sandbox.stub(eventProtocol, 'publishNodeAttrEvent').resolves();
            this.sandbox.stub(waterline.nodes, 'getNodeById').resolves();
            waterline.nodes.getNodeById.resolves(node);

            return nodes.create({name: 'a node'})
            .then(function(node) {
               return obms.upsertByNode(node.id, {
                    service: 'ipmi-obm-service',
                    config: {
                        host: 'ipmi-host',
                        user: 'ipmi-user',
                        password: 'ipmi-password'
                    }
                });
            })
            .then(function(obm) {
                expect(obm.config).to.have.property('password')
                    .and.not.equal('ipmi-password');
                expect(encryption.decrypt(obm.config.password)).to.equal('ipmi-password');
            });
        });
    });
});
