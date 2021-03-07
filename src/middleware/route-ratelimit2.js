/*
This file will replace the original rate-limit.js file.

Sets the rate limits for the anonymous and paid tiers. Current rate limits:
- 1000 points in 60 seconds
- 10 points per call for paid tier (100 RPM)
- 50 points per call for anonymous tier (20 RPM)

The rate limit handling is designed for these four use cases:
- Users who want to buy a JWT token for 24 hour access.
- Users who want to buy different RPM tiers: 100, 250, 600
- Basic Authentication which should not have any rate limits applied.

The Basci Auth use cases is considered when determining internal rate limits.
The internal rate limits should not be applied to calls from those users.

A lot of attention has been paid to passing rate-limit information for the user
when they trigger an endpoint that makes a lot of internal API calls. Examples
are hydrateUtxos() and getPublicKey().
*/

// Public npm libraries.
const jwt = require('jsonwebtoken')
const Redis = require('ioredis')
const { RateLimiterRedis } = require('rate-limiter-flexible')

// local libraries.
// const wlogger = require('../util/winston-logging')
const config = require('../../config')

// let _this // Global pointer to instance of class, when 'this' context is lost.

// Setup Redis to track rate limits for each user.
const redisOptions = {
  enableOfflineQueue: false,
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379,
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1'
}
console.log(`redisOptions: ${JSON.stringify(redisOptions, null, 2)}`)
const redisClient = new Redis(redisOptions)
const rateLimitOptions = {
  storeClient: redisClient,
  points: 1000, // Number of points
  duration: 60 // Per minute (per 60 seconds)
}

// Constants
// const ANON_LIMITS = config.anonRateLimit
// const WHITELIST_RATE_LIMIT = config.whitelistRateLimit
// const WHITELIST_DOMAINS = config.whitelistDomains
// const INTERNAL_RATE_LIMIT = 1

class RateLimits {
  constructor () {
    // _this = this

    this.jwt = jwt
    this.rateLimiter = new RateLimiterRedis(rateLimitOptions)
    this.config = config
  }

  // This is the main middleware funciton of this library. All other functions
  // support this function.
  async applyRateLimits (req, res, next) {
    try {
      // let userId
      // let decoded = {}

      // Create a re*Q*.locals object if not passed in.
      // req.locals.proLimit will be true if the user is using Basic Authentication.
      if (!req.locals) {
        req.locals = {
          // default values
          jwtToken: '',
          proLimit: false,
          apiLevel: 0
        }
      }

      // Create a re*S*.locals object if it does not exist.
      if (!res.locals) {
        res.locals = {
          rateLimitTriggered: false
        }
      }
    } catch (err) {

    }
  }

  // Used to disconnect from the Redis DB.
  // Called by unit tests so that node.js thread doesn't live forever.
  closeRedis () {
    redisClient.disconnect()
  }

  // Clear the redis database. Used by unit tests.
  async wipeRedis () {
    await redisClient.flushdb()
  }
}

module.exports = RateLimits
