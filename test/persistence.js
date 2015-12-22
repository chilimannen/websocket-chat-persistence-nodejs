/**
 * @author Robin Duda
 *
 * Tests the backend, the connector of the frontend chatserver implementations.
 *
 * Tests authentication, database storage and replication between servers.
 */

require('./../bin/backend/database');
require('./param-config');
var uuid = require('uuid');
var hasher = require('./../bin/backend/hash');
var hmac = require('./../bin/backend/hmac');
var scrypt = require('./../bin/backend/scrypt');
var connector = require('./../bin/backend/persistence');
var assert = require('assert');
var Mocks = require('./mocks');
var Protocol = require('./../bin/protocol');
var async = require('async');
var account = require('../bin/backend/account.js');
var messaging = require('../bin/backend/messaging.js');
var rooms = require('../bin/backend/rooms.js');

describe('persistence', function () {
    var username = uuid.v4();
    var password = uuid.v4();

    describe('Mocks', function () {
        it('Should test that the socket mock is working.', function (done) {
            var socket = new Mocks.Socket(function (data) {
                assert.equal(data.message, 'message');
                done();
            });
            socket.send(JSON.stringify({message: 'message'}));
        });
    });

    describe('Authentication', function () {

        it('Should create a new account if none exists.', function (done) {
            connector.handler["authenticate"](new Mocks.Socket(function (data) {
                assert.equal(data.created, true, 'not created.');
                assert.equal(data.authenticated, true, 'not authenticated.');
                done();
            }), new Protocol.Authenticate(username, password));
        });

        it('Should reject accounts not authorized.', function (done) {
            connector.handler["authenticate"](new Mocks.Socket(function (data) {
                assert.notEqual(data.authenticated, true);
                done();
            }), new Protocol.Authenticate(username, 'password-wrong'));
        });

        it('Should authenticate users if exists.', function (done) {
            connector.handler["authenticate"](new Mocks.Socket(function (data) {
                assert.equal(data.authenticated, true);
                assert.notEqual(data.created, false);
                done();
            }), new Protocol.Authenticate(username, password));
        });

        it('Should contain authentication digest.', function (done) {
            connector.handler["authenticate"](new Mocks.Socket(function (data) {
                assert.equal(data.authenticated, true);
                assert.notEqual(data.token, undefined);
                done();
            }), new Protocol.Authenticate(username, password));
        });

        describe('Hash', function () {
            var password = 'defined';
            var password2 = 'undefined';

            it('Should not generate the same hash for two equal passwords', function (done) {
                hasher.calculate(function (err, salt, hash) {
                    hasher.calculate(function (err, salt, next_hash) {
                        assert.notEqual(hash, next_hash);
                        done();
                    }, password)
                }, password);
            });

            it('Should calculate the wrong hash when passwords are mismatching.', function (done) {
                hasher.calculate(function (err, salt, hash) {
                    hasher.calculate(function (err, salt, next_hash) {
                        assert.notEqual(hash, next_hash);
                        done();
                    }, password2, salt)
                }, password);
            });

            it('Should calculate the same hash when passwords are matching.', function (done) {
                hasher.calculate(function (err, salt, hash) {
                    hasher.calculate(function (err, salt, next_hash) {
                        assert.equal(hash, next_hash);
                        done();
                    }, password, salt)
                }, password);
            });

        });

        describe('Scrypt', function () {

            var password = 'pass_1';
            var password2 = 'pass_2';

            it('Should not generate the same hash for two equal passwords', function (done) {
                scrypt.calculate(password, function (err, hash) {
                    scrypt.calculate(password, function (err, next_hash) {
                        assert.notEqual(hash, next_hash);
                        done();
                    })
                });
            });

            it('Should calculate the wrong hash when passwords are mismatching.', function (done) {
                scrypt.calculate(password, function (err, hash) {
                    scrypt.verify(hash, password2, function (err, result) {
                        assert.equal(result, false);
                        done();
                    })
                });
            });

            it('Should calculate the same hash when passwords are matching.', function (done) {
                scrypt.calculate(password, function (err, hash) {
                    scrypt.verify(hash, password, function (err, result) {
                        assert.equal(result, true);
                        done();
                    })
                });
            });

        });


        describe('HMAC', function () {
            it('Should generate a HMAC digest from username, expiry and secret', function (done) {
                var token = hmac.generate("username");

                hmac.validate(token, function (err, result) {
                    if (result)
                        done();
                    else
                        throw new Error("Hmac did not validate.");

                });
            });

            it('Should not validate HMAC with invalid parameters.', function (done) {
                var token = hmac.generate("user");

                async.parallel([
                    function (callback) {
                        var wrong = token;
                        wrong.username = "another";
                        hmac.validate(wrong, callback);
                    },
                    function (callback) {
                        var wrong = token;
                        wrong.expiry = 1000000000;
                        hmac.validate(wrong, callback);
                    },
                    function (callback) {
                        var wrong = token;
                        wrong.key = "null";
                        hmac.validate(wrong, callback);
                    }
                ], function (err, result) {

                    for (var i = 0; i < result.length; i++)
                        assert.equal(result[i], false);

                    done();
                });
            });

            it('Generated HMAC should be set to expire in 15 minutes.', function (done) {
                var token = hmac.generate("dat_user");
                var seconds = token.expiry - new Date().getTime();

                if (seconds < 899)
                    throw new Error("Token only valid for " + seconds + "s.");

                done();
            });
        });
    });

    describe('Database', function () {
        var room = uuid.v4();

        it('Should store an account in the database with authentication.', function (done) {
            account.authenticate(username, password, function (result) {
                assert.equal(result.authenticated, true);
                assert.equal(result.username, username);
                done();
            });
        });

        it('Should store a message in the database.', function (done) {
            messaging.clear(room, function () {

                messaging.add({room: room, content: 'test', sender: 'me'}, function () {

                    messaging.history(room, function (result) {
                        for (var i = 0; i < result.length; i++) {
                            if (result[i].content == 'test' && result[i].sender == 'me')
                                done();
                        }
                    });

                });
            });
        });

        it('Should remove all messages from a room in the database.', function (done) {
            messaging.add({room: room, content: 'testy_tests', sender: '__remove_message__'}, function () {
                messaging.clear(room, function () {

                    messaging.history(room, function (result) {
                        assert.equal(result.length, 0);
                        done();
                    });

                });
            });
        });

        it('Should (create | load) a room (not | if) exists.', function (done) {
            rooms.load(room, 'owner', 'topic', function (result) {
                assert.equal(result.created, true);
                assert.equal(result.room, room);
                assert.equal(result.topic, 'topic');
                assert.equal(result.owner, 'owner');

                rooms.load(room, 'owner_new', 'topic_new', function (result) {
                    assert.equal(result.room, room);
                    assert.equal(result.topic, 'topic');
                    assert.equal(result.owner, 'owner');

                    assert.equal(result.created, false);
                    done();
                });
            });
        });

        it('Should remove a room from the database.', function (done) {
            var room = uuid.v4();
            rooms.load(room, 'owner', 'topic', function (result) {
                assert.equal(result.created, true);
                assert.equal(result.room, room);
                assert.equal(result.topic, 'topic');
                assert.equal(result.owner, 'owner');

                rooms.clear(room, function () {
                    rooms.load(room, 'new_owner', 'new_topic', function (result) {
                        assert.equal(result.created, true);
                        assert.equal(result.owner, 'new_owner');
                        assert.equal(result.topic, 'new_topic');
                        done();
                    });
                });
            });
        });

        it('Should change the topic of a room in the database', function (done) {
            var room = uuid.v4();
            rooms.load(room, 'owner', 'topic', function () {
                rooms.topic(room, 'topic_new');

                rooms.load(room, null, null, function (result) {
                    assert.equal(result.topic, 'topic_new');
                    done();
                });
            });
        });

    });
});
