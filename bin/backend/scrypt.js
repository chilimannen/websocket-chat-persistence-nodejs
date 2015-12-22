/**
 * @author Robin Duda
 *
 * Password hashing with Scrypt.
 */

var scrypt = require('scrypt');
var params = scrypt.paramsSync(0.01);

module.exports = {
    /**
     * Uses scrypt as a kdf to generate a hash.
     * @param password base64 string representing password.
     * @param callback returns the hash as a base64 expanded string.
     */
    calculate: function (password, callback) {
        scrypt.kdf(password, params, function (err, result) {
            if (!err)
                callback(err, result.toString('base64'));
            else
                throw err;
        });
    },

    /**
     * Verifies a scrypt-generated hash.
     * @param hash the original hash as base64.
     * @param password the password to test for equality.
     * @param callback true | false
     */
    verify: function (hash, password, callback) {
        scrypt.verifyKdf(new Buffer(hash, 'base64'), password, function (err, result) {
            if (!err)
                callback(err, result);
            else
                throw err;
        });
    }
};