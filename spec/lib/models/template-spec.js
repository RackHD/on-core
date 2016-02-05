// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
function MessengerServices()  {
}
MessengerServices.prototype.start = sinon.stub().returns(Promise.resolve());
MessengerServices.prototype.stop = sinon.stub().returns(Promise.resolve());
MessengerServices.prototype.publish = sinon.stub().returns(Promise.resolve());

describe('Models.Template', function () {
    helper.before(function () {
        return [
            helper.di.simpleWrapper(MessengerServices, 'Messenger')
        ];
    });

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').templates;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('name', function () {
            before(function () {
                this.subject = this.attributes.name;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('contents', function () {
            before(function () {
                this.subject = this.attributes.contents;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });
    });
});
