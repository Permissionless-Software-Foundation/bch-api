/*
  Common configuration settings.
  Default settings in this file can be overridden by an environment variable.
*/

const config = {
  // This is the same secret used by jwt-bch-api
  apiTokenSecret: process.env.TOKENSECRET
    ? process.env.TOKENSECRET
    : 'secret-jwt-token',

  // Rate Limits
  anonRateLimit: process.env.ANON_RATE_LIMIT ? Number(process.env.ANON_RATE_LIMIT) : 50,
  whitelistRateLimit: process.env.WHITELIST_RATE_LIMIT
    ? Number(process.env.WHITELIST_RATE_LIMIT)
    : 10,
  whitelistDomains: process.env.WHITELIST_DOMAINS
    ? process.env.WHITELIST_DOMAINS.split(',')
    : ['fullstack.cash', 'psfoundation.cash']
}

module.exports = config
