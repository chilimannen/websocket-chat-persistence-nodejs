/**
 * @author Robin Duda
 *
 * Message model.
 */

var mongoose = require('./database').database();

var messageSchema = new mongoose.Schema({
        sender: String,
        content: String,
        room: String,
        command: Boolean
    }, {strict: true}
);

var Message = mongoose.model('message', messageSchema);
var HISTORY_LIMIT = 150;

module.exports = {
    /**
     * Get the message history of a room.
     * @param name of the room to get the history from.
     * @param callback object {room, content, sender, command}
     */
    history: function (name, callback) {
        name = name.toString();

        Message.find({room: name}, {_id: 0, timestamp: 0, room: 0, __v: 0}).sort({_id: 1}).limit(HISTORY_LIMIT)
            .exec(function (err, result) {
                if (result)
                    callback(result);
                else if (err)
                    throw err;
            });
    },

    /**
     * Adds a new message to the room history.
     * @param message object {sender, content, command: boolean, room}
     * @param callback called on completion.
     */
    add: function (message, callback) {
        Message.collection.insert(message.list, callback);
        /*new Message(
            {
                sender: message.sender,
                content: message.content,
                command: message.command,
                room: message.room,
                timestamp: (new Date).getTime()
            })
            .save(function (err) {
                if (err)
                    throw err;

                if (callback)
                    callback();
            });*/
    },

    /**
     * Removes all messages attached to a room.
     * @param room name from where all messages should be removed.
     * @param callback called on completion.
     */
    clear: function (room, callback) {
        Message.remove({room: room}, function () {
            if (callback)
                callback();
        });
    }
};