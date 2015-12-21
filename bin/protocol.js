/**
 * @author Robin Duda
 *
 * Class represents a shared notion of transfer objects.
 */


module.exports = {

    Message: function (content, room, sender, command) {
        this.header = {
            action: 'message'
        };

        this.room = room;
        this.content = content;
        this.sender = sender;
        this.command = command;
    },

    Room: function (room, topic, username, actor) {
        this.header = {
            action: 'room',
            actor: actor
        };

        this.room = room;
        this.topic = topic;
        this.username = username;
    },

    Topic: function (room, topic) {
        this.header = {
            action: 'topic'
        };

        this.room = room;
        this.topic = topic;
    },

    Authenticate: function (username, password, actor) {
        this.header = {
            action: 'authenticate',
            actor: actor
        };

        this.username = username;
        this.password = password;
        this.created = undefined;
        this.authenticated = undefined;
    },

    History: function (room, actor) {
        this.header = {
            action: 'history',
            actor: actor
        };

        this.room = room;
        this.list = undefined;
    },

    Register: function (servername, port) {
        this.header = {
            action: 'register'
        };

        this.port = port;
        this.name = servername;
    },

    ServerList: function (actor) {
        this.header = {
            action: 'server.list',
            actor: actor
        };

        this.list = undefined;
    }
};