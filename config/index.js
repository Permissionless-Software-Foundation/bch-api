/*
  Common configuration settings.
*/

const electrumxConfig = require('./electrumx')

const config = {
  apiTokenSecret: process.env.TOKENSECRET ? process.env.TOKENSECRET : 'secret-jwt-token',
  electrumx: electrumxConfig
}

module.exports = config
