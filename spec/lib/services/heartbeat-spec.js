// Copyright 2016, EMC, Inc.

'use strict';
require('../../helper');

describe('Heartbeat', function () {
    var sandbox = sinon.sandbox.create();
    var heartbeat;
    var constants;
    var subscription = {
        dispose: sandbox.stub().resolves()
    };
    var rx = {
        Observable: {
            interval: sandbox.stub().returns({
                takeWhile: sandbox.stub().returns({
                    subscribe: sandbox.spy(function(f1,f2) {
                        f1();
                        f2({error:'error'});
                        return {
                            dispose: sandbox.stub().resolves(subscription)
                        };
                    })
                })
            })
        }
    };
    var events = {
        publishExternalEvent: sandbox.stub().returns(
            Promise.resolve()
        )
    };
    var dns = {
        lookupServiceAsync: sandbox.stub(),
        lookupAsync: sandbox.stub()
    };
    
    helper.before(function() {
        return [ 
            helper.di.simpleWrapper(events, 'Protocol.Events'),
            helper.di.simpleWrapper(rx, 'Rx')
        ];
    });

    before(function () {
        heartbeat = helper.injector.get('Services.Heartbeat');
        constants = helper.injector.get('Constants');
        sandbox.stub(heartbeat, 'requireDns').returns(dns);
    });
    
    beforeEach(function() {
        sandbox.reset();
    });

    helper.after(function() {
        sandbox.restore();
    });

    describe('heartbeatService', function() {
        it('should start', function() {
            return heartbeat.start()
            .then(function() {
                expect(rx.Observable.interval).to.be.calledOnce;
                expect(heartbeat.subscription).to.be.resolved;
                expect(heartbeat.running).to.be.true;
            });
        });
        
        it('should stop', function() {
            return heartbeat.start().then(function() {
                return heartbeat.stop().then(function() {
                    expect(heartbeat.subscription.dispose).to.have.been.calledOnce;
                    expect(heartbeat.running).to.be.false;
                });
            });
        });
        
        it('should send heartbeat message', function() {
            return heartbeat.sendHeartbeat()
            .then(function() {
                expect(events.publishExternalEvent).to.be.calledOnce;
            });
        });

        it('should resolve hostname', function() {
            dns.lookupServiceAsync.resolves(undefined);
            return heartbeat.getFqdn().then(function(hostname) {
                expect(hostname).to.equal(constants.Host);
            });
        });

        it('should resolve FQDN', function() {
            var testFqdn = constants.Host + '.example.com';
            dns.lookupServiceAsync.resolves([testFqdn]);
            dns.lookupAsync.resolves(['1.2.3.4', 4]);
            return heartbeat.getFqdn().then(function(fqdn) {
                expect(fqdn).to.equal(testFqdn);
            });
        });
    });
});

