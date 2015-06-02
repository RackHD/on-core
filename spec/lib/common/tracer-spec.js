// Copyright (c) 2015, EMC Corporation


'use strict';

var express = require('express'),
    domain = require('domain');

describe('Tracer', function () {
    var Context;

    helper.before();

    before(function () {
        Context = helper.injector.get('Context');

        this.subject = helper.injector.get('Tracer');
    });

    helper.after();

    describe('active', function () {
        it('should return an active context', function () {
            this.subject.active.should.be.an.instanceof(Context);
        });
    });

    describe('findOrCreateContext', function () {
        it('should create a context object if none exists', function () {
            var context = this.subject.findOrCreateContext('create', { a: 'a' });

            context.should.be.an.instanceof(Context);
            context.id.should.equal('create');
            context.a.should.equal('a');
        });

        it('should return an existing context object if one exists', function () {
            var context = this.subject.findOrCreateContext('reuse', { a: 'a' });

            context.should.be.an.instanceof(Context);
            context.id.should.equal('reuse');
            context.a.should.equal('a');
        });

        it('should merge options into an existing context object', function () {
            var context = this.subject.findOrCreateContext('merge', { a: 'a'});

            context.should.be.an.instanceof(Context);
            context.id.should.equal('merge');
            context.a.should.equal('a');

            context = this.subject.findOrCreateContext('merge', { b: 'b'});

            context.should.be.an.instanceof(Context);

            context.id.should.equal('merge');
            context.b.should.equal('b');
        });
    });

    describe('run', function () {
        it('should run using the provided context', function (done) {
            var self = this,
                context = this.subject.findOrCreateContext('run');

            this.subject.run(function () {
                self.subject.active.id.should.equal(context.id);
                done();
            }, context.id);
        });

        it('should merge options into an existing context object', function (done) {
            var self = this,
                context = this.subject.findOrCreateContext('merge');

            this.subject.run(function () {
                self.subject.active.id.should.equal(context.id);
                self.subject.active.a.should.equal('a');
                done();
            }, context.id, { a: 'a' });
        });
    });

    describe('middleware', function () {
        beforeEach(function () {
            this.app = express();
            this.app.use(this.subject.middleware());
        });

        it('should create a domain and attach the req/res objects to it', function (done) {
            this.app.use(function (req, res) {
                domain.active.members.length.should.equal(2);
                res.end();
            });

            request(this.app)
                .get('/')
                .expect(200, done);
        });

        it('should set an x-trace-id header on the response', function (done) {
            this.app.use(function (req, res) {
                res.end();
            });

            request(this.app)
                .get('/')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        should.not.equal(res.headers['x-trace-id'], undefined);
                        done();
                    }
                });
        });

        it('should utilize the same context for multiple middlewares', function (done) {
            var tracer = this.subject;

            this.app.use(function (req, res, next) {
                req.traceId = tracer.active.id;
                next();
            });

            this.app.use(function (req, res) {
                req.traceId.should.equal(tracer.active.id);
                res.end();
            });

            request(this.app)
                .get('/')
                .expect(200, done);
        });
    });
});