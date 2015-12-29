/**
 * @author Robin Duda
 *
 * Class represents a shared notion of transfer objects.
 */


module.exports = {

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

    Logging: function (ins, out) {
        this["in"] = ins;
        this.out = out;
        this.type = 'logging.io';
        this.name = 'persistence';
    }
};