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
var connector = require('./../bin/backend/persistence');
var assert = require('assert');
var Mocks = require('./mocks');
var Protocol = require('./../bin/protocol');

describe('connector', function () {
    var username = uuid.v4();
    var password = uuid.v4();


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

        // callback, pass, salt - err, pass, salt
        it('Should generate a salt when hashing if none is given.', function (done) {
            hasher.calculate(function (err, salt, hash) {
                assert.notEqual(salt, null);
                done();
            }, password)
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
    });

    describe('Database', function () {
        it('Should store an account in the database with authenticateion.', function (done) {

        });

        it('Should store a message in the database.', function (done) {

        });

        it('Should change the topic of a room in the database', function (done) {

        });

        it('Should (create | load) a room (not | if) exists.', function (done) {

        });
    });
});