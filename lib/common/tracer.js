// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = TracerFactory;

di.annotate(TracerFactory, new di.Provide('Tracer'));
di.annotate(TracerFactory,
    new di.Inject(
        'domain',
        'Context',
        'lru-cache',
        '_'
    )
);

function TracerFactory (domain, Context, lru, _) {
    function Tracer () {
        this.cache = lru(500);

        Object.defineProperty(this, 'active', {
            get: function () {
                if (domain && domain.active && domain.active.id) {
                    return this.findOrCreateContext(domain.active.id);
                } else {
                    return this.findOrCreateContext();
                }
            }
        });
    }

    Tracer.prototype.findOrCreateContext = function (id, options) {
        var context = this.cache.get(id);

        if (context === undefined) {
            context = new Context(id);

            this.cache.set(context.id, context);
        }

        _.merge(context, options || {});

        return context;
    };

    /**
     * Tracer run executes a callback in the context of a new domain or a domain
     * based on the provided context id.
     */
    Tracer.prototype.run = function (next, id, options) {
        var current = domain.create(),
            context = this.findOrCreateContext(id, options);

        current.id = context.id;

        current.on('error', function (error) {
            console.log(error);
            console.log(error.stack);
        });

        current.run(function () {
            next();
        });
    };

    /**
     * Tracer middleware creates a domain per request to allow context to be stored
     * and shared between the original request and the downstream call stack.
     */
    Tracer.prototype.middleware = function () {
        var self = this;

        return function (req, res, next) {
            var current = domain.create(),
                context = self.findOrCreateContext();

            context.set('url', req.url);
            context.set('method', req.method);

            current.id = context.id;

            // Add the request/response objects to the domain.
            current.add(req);
            current.add(res);

            // Set a header for clients to use for referencing.
            res.setHeader('X-Trace-Id', context.id);

            // Handle errors and pass them to the remaining error middleware.
            current.on('error', function (error) {
                console.log(error);
                console.log(error.stack);

                next(error);
            });

            // Run the remaining middleware in the context of the domain.
            current.run(function () {
                next();
            });
        };
    };

    return new Tracer();
}