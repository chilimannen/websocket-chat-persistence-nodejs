/**
 * @author Robin Duda
 *
 * For token-based authentication, signs tokens with a HMAC.
 */

var crypto = require('crypto');
var secret = "0000000000000000000000000000000000000000000000000000000000000000"; // todo secrets must be changed.
var duration = 3600 * 0.25;

module.exports = {
    /**
     * Generates a token for signing.
     * @param username username to authenticate.
     * @return  object {hmac, usename, date}
     */
    generate: function (username) {
        var expiry = expirationMS();
        return {key: calculate(username, expiry), username: username, expiry: expiry, success: true};
    },

    /**
     * Validates the authenticity of a token.
     * @param token to be validated.
     * @param callback true | false
     */
    validate: function (token, callback) {
        var key = calculate(token.username, token.expiry);

        crypto.randomBytes(128, function (err, nonce) {
            if (err) {
                callback(err, false);
            } else {
                var source = crypto.createHash('sha512').update(token.key).update(nonce).digest('base64');
                var target = crypto.createHash('sha512').update(key).update(nonce).digest('base64');
                callback(err, source == target);
            }
        });
    }
};

function expirationMS() {
    return new Date().getTime() * 1000 + duration;
}

function calculate(username, expiry) {
    return crypto.createHmac('SHA512', secret)
        .update(username)
        .update(expiry.toString())
        .digest('hex');
}