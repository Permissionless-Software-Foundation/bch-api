/*
  Common configuration settings.
*/

module.exports = {
  apiTokenSecret: process.env.TOKENSECRET ? process.env.TOKENSECRET : 'secret-jwt-token'
}
