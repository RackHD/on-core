// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = coreServiceFactory;

coreServiceFactory.$provide = 'Services.Core';
coreServiceFactory.$inject = [
    'Q',
    '_',
    '$injector'
];

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
        var self = this,
            services = injector.getMatching(/^Services\.(?!Core).*/);

        services = sortByPriority(services);

        var startFuncs = _.map(services, function(service) {
            return service.start.bind(service);
        });

        return startFuncs.reduce(Q.when, Q.resolve()).then(function () {
            return self;
        });
    };

    CoreService.prototype.stop = function stop() {
        var services = injector.getMatching(/^Services\.(?!Core).*/);

        services = sortByPriority(services).reverse();

        var promises = _.map(services, function(service) {
            return service.stop();
        });

        return Q.allSettled(promises);
    };

    return new CoreService();
}

