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
  anonRateLimit: process.env.ANON_RATE_LIMIT
    ? Number(process.env.ANON_RATE_LIMIT)
    : 1000,
  whitelistRateLimit: process.env.WHITELIST_RATE_LIMIT
    ? Number(process.env.WHITELIST_RATE_LIMIT)
    : 10,
  internalRateLimit: process.env.INTERNAL_RATE_LIMIT
    ? Number(process.env.INTERNAL_RATE_LIMIT)
    : 10,
  pointsPerMinute: process.env.POINTS_PER_MINUTE
    ? Number(process.env.POINTS_PER_MINUTE)
    : 10000,
  whitelistDomains: process.env.WHITELIST_DOMAINS
    ? process.env.WHITELIST_DOMAINS.split(',')
    : ['fullstack.cash', 'psfoundation.cash', '10.0.'],

  restURL: process.env.LOCAL_RESTURL ? process.env.LOCAL_RESTURL : 'http://127.0.0.1:3000/v5/'
}

module.exports = config
