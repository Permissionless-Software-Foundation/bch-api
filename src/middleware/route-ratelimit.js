/*
  Sets the rate limits for the anonymous and paid tiers. Current rate limits:
  - 1000 points in 60 seconds
  - 10 points per call for paid tier (100 RPM)
  - 50 points per call for anonymous tier (20 RPM)

  Background:
  The rate limits below were originially coded with the idea of charging on a
  per-resource basis. However, that was confusing to end users trying to purchase
  a subscription. So everything was simplied to two tiers: paid and anonymous
*/

'use strict'

// Allow rate limits to be set with environment variables

const defaultRateLimit = process.env.DEFAULT_RATE_LIMIT || 50
const whitelistedRateLimit = process.env.WHITELIST_RATE_LIMIT || 10
const internalRateLimit = process.env.INTERNAL_RATE_LIMIT || 1
const whitelistedDomain = process.env.WHITELISTED_DOMAIN || 'sandbox.fullstack.cash'

const wlogger = require('../util/winston-logging')
const config = require('../../config')

// Redis
const redisOptions = {
  enableOfflineQueue: false,
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379,
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1',
}
console.log(`redisOptions: ${JSON.stringify(redisOptions, null, 2)}`)

const Redis = require('ioredis')
const redisClient = new Redis(redisOptions)

// Rate limiter middleware lib.
const { RateLimiterRedis } = require('rate-limiter-flexible')
const rateLimitOptions = {
  storeClient: redisClient,
  points: 1000, // Number of points
  duration: 60, // Per minute (per 60 seconds)
}

let _this

class RateLimits {
  constructor() {
    _this = this

    this.rateLimiter = new RateLimiterRedis(rateLimitOptions)
    this.config = config
  }

  // Used to disconnect from the Redis DB.
  // Called by unit tests so that node.js thread doesn't live forever.
  closeRedis() {
    redisClient.disconnect()
  }

  async wipeRedis() {
    await redisClient.flushdb()
  }

  // This is the new rate limit function that uses the rate-limiter-flexible npm
  // library. It uses fine-grain rate limiting based on the resources being
  // consumed.
  async rateLimitByResource(req, res, next) {
    try {
      let userId
      const decoded = {}

      // Create a req.locals object if not passed in.
      if (!req.locals) {
        req.locals = {
          // default values
          jwtToken: '',
          proLimit: false,
          apiLevel: 0,
        }
      }

      // Create a res.locals object if it does not exist. This is used for
      // debugging.
      if (!res.locals) {
        res.locals = {
          rateLimitTriggered: false,
        }
      }

      // Default value is 50 points per request = 20 RPM
      let rateLimit = defaultRateLimit

      // Code here for the rate limiter is adapted from this example:
      // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#authorized-and-not-authorized-users
      try {
        // The resource being consumed: full node, indexer, SLPDB, etc.
        const resource = _this.getResource(req.url)
        wlogger.debug(`resource: ${resource}`)

        let key = userId || req.ip
        res.locals.key = key // Feedback for tests.

        // const pointsToConsume = userId ? 1 : 30
        decoded.resource = resource
        let pointsToConsume = defaultRateLimit // No jwt
        res.locals.pointsToConsume = pointsToConsume // Feedback for tests.

        // Retrieve the origin.
        let origin = req.get('origin')

        // Handle calls coming from the intranet.
        if (origin === undefined && key.indexOf('10.0.0.5') > -1) {
          origin = 'slp-api'
        }

        wlogger.info(`origin: ${origin}`)

        // If the request originates from one of the approved wallet apps, then
        // apply paid-access rate limits.
        if (
          origin &&
          (origin.toString().indexOf('wallet.fullstack.cash') > -1 ||
            origin.toString().indexOf(whitelistedDomain) > -1 ||
            origin === 'slp-api')
        ) {
          pointsToConsume = whitelistedRateLimit
          res.locals.pointsToConsume = pointsToConsume // Feedback for tests.
        }

        // For internal calls, increase rate limits to as fast as possible.
        if (
          key.toString().indexOf('172.17.') > -1 ||
          key.toString().indexOf('::ffff:127.0.0.1') > -1
        ) {
          pointsToConsume = internalRateLimit
          res.locals.pointsToConsume = pointsToConsume // Feedback for tests.
        }

        wlogger.info(`User ${key} consuming ${pointsToConsume} point for resource ${resource}.`)

        rateLimit = Math.floor(1000 / pointsToConsume)

        // Update the key so that rate limits track both the user and the resource.
        key = `${key}-${resource}`

        await _this.rateLimiter.consume(key, pointsToConsume)
      } catch (err) {
        // console.log('err: ', err)

        // Used for returning data for tests.
        res.locals.rateLimitTriggered = true
        // console.log('res.locals: ', res.locals)

        // Rate limited was triggered
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: `Too many requests. Your limits are currently ${rateLimit} requests per minute.`,
        })
      }
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/newRateLimit(): ', err)
      // throw err
    }

    next()
  }

  // This function parses the req.url property to identify what resource
  // the user is requesting.
  // This was created as a function so that it can be unit tested. Not sure
  // what kind of variations will be seen in production.
  getResource(url) {
    try {
      wlogger.debug(`url: ${JSON.stringify(url, null, 2)}`)

      const splitUrl = url.split('/')
      const resource = splitUrl[1]

      return resource
    } catch (err) {
      wlogger.error('Error in getResource().')
      throw err
    }
  }
}

module.exports = RateLimits
