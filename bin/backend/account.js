/**
 * @author Robin Duda
 *
 * Account model for the database.
 */

var mongoose = require('./database').database();
var scrypt = require('./scrypt.js');

var accountSchema = new mongoose.Schema({
        username: String,
        password: String
    }, {strict: true}
);

var Account = mongoose.model('account', accountSchema);

module.exports = {

    /**
     * Authenticates an account if exists, if not exists then the Account is created.
     * @param username the username of the account.
     * @param password the password of the account.
     * @param callback object {authenticated: boolean, created: boolean}
     */
    authenticate: function (username, password, callback) {
        username = username.toString();
        password = password.toString();

        Account.where({username: username}).findOne(function (err, result) {

                if (result) {
                    scrypt.verify(result.password, password, function (err, result) {
                        callback({authenticated: result, username: username});
                    });

                } else if (!err) {
                    scrypt.calculate(password, function (err, hash) {

                        new Account({username: username, password: hash})
                            .save(function (err) {
                                callback({authenticated: (err == null), created: (err == null), username: username});
                            });
                    });
                }
            }
        ).exec();
    }
};