// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = coreServiceFactory;

di.annotate(coreServiceFactory, new di.Provide('Services.Core'));

di.annotate(coreServiceFactory,
    new di.Inject(
        'Q',
        '_',
        di.Injector
    )
);

function coreServiceFactory(Q, _, injector) {
    function sortByPriority(services) {
        return _.sortBy(services, function(service) {
            if (_.has(service, 'startupPriority')) {
                return service.startupPriority;
            } else {
                return Infinity;
            }
        });
    }

    function CoreService () {
    }

    CoreService.prototype.start = function start() {
        // Get all services except ourself
        var services = injector.getMatching(/Services\.(?!Core).*/);
        services = sortByPriority(services);
        var startFuncs = _.map(services, function(service) {
            // Q likes to change 'this', so bind it
            return service.start.bind(service);
        });
        return startFuncs.reduce(Q.when, Q())  // jshint ignore: line
        .then(function() {
            var protocols = injector.getMatching(/Protocol.Exchanges\.(?!Base).*/);
            return Q.all(_.map(protocols, function(protocol) {
                return protocol.start();
            }));
        });
    };

    CoreService.prototype.stop = function stop() {
        // Get all services except ourself
        var services = injector.getMatching(/Services\.(?!Core).*/);
        services = sortByPriority(services).reverse();
        var stopFuncs = _.map(services, function(service) {
            // Q likes to change 'this', so bind it
            return service.stop.bind(service);
        });
        return stopFuncs.reduce(Q.when, Q())  // jshint ignore: line
    };

    return new CoreService();
}
