/*
  Common configuration settings.
*/

const config = {
  apiTokenSecret: process.env.TOKENSECRET ? process.env.TOKENSECRET : 'secret-jwt-token'
}

module.exports = config
