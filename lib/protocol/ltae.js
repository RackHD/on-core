// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ltaeProtocolFactory;

ltaeProtocolFactory.$provide = 'Protocol.Ltae';
ltaeProtocolFactory.$inject = [
    'Constants',
    'Services.Messenger',
    'Assert'
];

function ltaeProtocolFactory (
    Constants,
    messenger,
    assert
) {
    function LtaeProtocol () {
    }

    LtaeProtocol.prototype.publishLtae = function (data) {
        assert.string(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Ltae.Name,
            'lta_to_ltae',
            data
        );
    };

    LtaeProtocol.prototype.makeMessage = function (messageIdName, args) {
        assert.string(messageIdName);
        assert.object(args);

        var alerts = {},
            alertsString = '';
        /* This message format is defined by OnRack northbound, ignore jshint check here */
        alerts['messageID']        = 'onrackconductor.0.3.0.' + messageIdName; /*jshint ignore:line*/
        alerts['bounding_style']   = 'self';        /* jshint ignore:line */
        alerts['in_condition']     = 'True';        /* jshint ignore:line */
        alerts['time_created']     = new Date();    /* jshint ignore:line */
        alerts['version']          = '1.0';         /* jshint ignore:line */
        alerts['arguments']        = args;          /* jshint ignore:line */

        alertsString = JSON.stringify(alerts);

        return alertsString;
    };

    return new LtaeProtocol();
}
