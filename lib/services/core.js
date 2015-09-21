// Copyright 2015, EMC, Inc.

'use strict';

module.exports = coreServiceFactory;

coreServiceFactory.$provide = 'Services.Core';
coreServiceFactory.$inject = [
    'Promise',
    '_',
    '$injector'
];

function coreServiceFactory(Promise, _, injector) {
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

        return Promise.reduce(services, function (accumulator, service) {
            return service.start();
        }, {}).then(function () {
            return self;
        });
    };

    CoreService.prototype.stop = function stop() {
        var services = injector.getMatching(/^Services\.(?!Core).*/);

        services = sortByPriority(services).reverse();

        var promises = _.map(services, function(service) {
            return service.stop();
        });

        return Promise.settle(promises);
    };

    return new CoreService();
}
