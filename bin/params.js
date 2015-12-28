/**
 * @author Robin Duda
 *
 * Parses command line parameters.
 */

module.exports = {
    persistence: {
        listenPort: process.argv[3]
    },

    logging: {
        host: 'localhost',
        port: 5454,
        interval: 1000
    }
};
