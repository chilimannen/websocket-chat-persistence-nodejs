/**
 * @author Robin Duda
 *
 * Sends log data to the logging component.
 */
var WebSocket = require('ws');
var params = require('../params');
var Protocol = require('../protocol');
var requests = 0;
var responses = 0;
var host = 'socket://' + params.logging.host + ':' + params.logging.port + '/';
var socket = new WebSocket(host);

socket.on('error', function () {
    socket = new WebSocket(host);
});

module.exports = {
    request: function () {
        requests += 1;
    },

    response: function () {
        responses += 1;
    }
};

setInterval(function () {
    if (socket.readyState == 1)
        socket.send(JSON.stringify(new Protocol.Logging(requests, responses)));

    requests = 0;
    responses = 0;
}, params.logging.interval);