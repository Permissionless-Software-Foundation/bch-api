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

// Public npm libraries.
const jwt = require('jsonwebtoken')

// local libraries.
const wlogger = require('../util/winston-logging')
const config = require('../../config')

const ANON_LIMITS = config.anonRateLimit
const WHITELIST_RATE_LIMIT = config.whitelistRateLimit
const WHITELIST_DOMAINS = config.whitelistDomains
const INTERNAL_RATE_LIMIT = 1

// Redis
const redisOptions = {
  enableOfflineQueue: false,
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379,
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1'
}
console.log(`redisOptions: ${JSON.stringify(redisOptions, null, 2)}`)

const Redis = require('ioredis')
const redisClient = new Redis(redisOptions)

// Rate limiter middleware lib.
const { RateLimiterRedis } = require('rate-limiter-flexible')
const rateLimitOptions = {
  storeClient: redisClient,
  points: 1000, // Number of points
  duration: 60 // Per minute (per 60 seconds)
}

let _this

class RateLimits {
  constructor () {
    _this = this

    this.jwt = jwt
    this.rateLimiter = new RateLimiterRedis(rateLimitOptions)
    this.config = config
  }

  // Used to disconnect from the Redis DB.
  // Called by unit tests so that node.js thread doesn't live forever.
  closeRedis () {
    redisClient.disconnect()
  }

  async wipeRedis () {
    await redisClient.flushdb()
  }

  // This is the new rate limit function that uses the rate-limiter-flexible npm
  // library. It uses fine-grain rate limiting based on the resources being
  // consumed.
  async rateLimitByResource (req, res, next) {
    try {
      let userId
      let decoded = {}

      // Create a req.locals object if not passed in.
      if (!req.locals) {
        req.locals = {
          // default values
          jwtToken: '',
          proLimit: false,
          apiLevel: 0
        }
      }

      // Create a res.locals object if it does not exist. This is used for
      // debugging.
      if (!res.locals) {
        res.locals = {
          rateLimitTriggered: false
        }
      }

      // Decode the JWT token if one exists.
      if (req.locals.jwtToken) {
        try {
          decoded = _this.jwt.verify(
            req.locals.jwtToken,
            _this.config.apiTokenSecret
          )
          // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

          userId = decoded.id
        } catch (err) {
          // This handler will be triggered if the JWT token does not match the
          // token secret.
          wlogger.error(
            `Last three letters of token secret: ${_this.config.apiTokenSecret.slice(
              -3
            )}`
          )
          wlogger.error(
            'Error trying to decode JWT token in route-ratelimit.js/newRateLimit(): ',
            err
          )
        }
        //
      } else if (req.body && req.body.usrObj) {
        // Same as above, but this code path is activated from internal calls to
        // bch-js, like hydrateUtxo() which passes the user object from the
        // original API call.

        try {
          decoded = _this.jwt.verify(
            req.body.usrObj.jwtToken,
            _this.config.apiTokenSecret
          )
          // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

          userId = decoded.id
        } catch (err) {
          // This handler will be triggered if the JWT token does not match the
          // token secret.
          wlogger.error(
            'Error in route-ratelimit.js trying to decode JWT token in usrObj'
          )
        }
      } else {
        wlogger.debug('No JWT token found!')
      }

      // Default value is 50 points per request = 20 RPM
      let rateLimit = ANON_LIMITS

      // Only evaluate the JWT token if the user is not using Basic Authentication.
      if (!req.locals.proLimit) {
        // Code here for the rate limiter is adapted from this example:
        // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#authorized-and-not-authorized-users
        try {
          // The resource being consumed: full node, indexer, SLPDB, etc.
          const resource = _this.getResource(req.url)
          wlogger.debug(`resource: ${resource}`)

          // Key will be the JWT ID if it exists, otherwise the IP address of the caller.
          let key = userId || req.ip
          res.locals.key = key // Feedback for tests.

          // For internal calls that make a lot of internal calls, like
          // hydrateUtxoDetails(), the origin of the caller will be passed in
          // via the POST body.
          const keyIsLocal =
            key.includes('172.17.0.1') || key.includes('127.0.0.1')
          if (req.body && req.body.usrObj && keyIsLocal) {
            // key = req.body.ip
            console.log(
              `route-ratelimit usrObj: ${JSON.stringify(
                req.body.usrObj,
                null,
                2
              )}`
            )
          }
          console.log(`key: ${key}`)

          // const pointsToConsume = userId ? 1 : 30
          decoded.resource = resource
          let pointsToConsume = _this.calcPoints(decoded)
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
          // console.log(`origin: ${JSON.stringify(origin, null, 2)}`)
          // console.log(`whitelist: ${JSON.stringify(WHITELIST_DOMAINS, null, 2)}`)
          const isInWhitelist = _this.isInWhitelist(origin)
          if (isInWhitelist) {
            pointsToConsume = WHITELIST_RATE_LIMIT
            res.locals.pointsToConsume = pointsToConsume // Feedback for tests.
          }

          // For internal calls, increase rate limits to as fast as possible.
          if (
            // Comment out the line below when running bch-js e2e rate limit tests.
            key.toString().indexOf('::ffff:127.0.0.1') > -1 ||
            // Do not comment out this line.
            key.toString().indexOf('172.17.') > -1
          ) {
            pointsToConsume = INTERNAL_RATE_LIMIT
            res.locals.pointsToConsume = pointsToConsume // Feedback for tests.
          }

          wlogger.info(
            `User ${key} consuming ${pointsToConsume} point for resource ${resource}.`
          )

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
            error: `Too many requests. Your limits are currently ${rateLimit} requests per minute. Increase rate limits at https://fullstack.cash`
          })
        }
      }
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/newRateLimit(): ', err)
      // throw err
    }

    next()
  }

  // Calculates the points consumed, based on the jwt information and the route
  // requested.
  calcPoints (jwtInfo) {
    let retVal = ANON_LIMITS // By default, use anonymous tier.

    try {
      // console.log(`jwtInfo: ${JSON.stringify(jwtInfo, null, 2)}`)

      const apiLevel = jwtInfo.apiLevel
      const resource = jwtInfo.resource

      const level30Routes = ['insight', 'bitcore', 'blockbook', 'electrumx']
      const level40Routes = ['slp']

      wlogger.debug(`apiLevel: ${apiLevel}`)

      // Only evaluate if user is using a JWT token.
      if (jwtInfo.id) {
        // SLP indexer routes
        if (level40Routes.includes(resource)) {
          if (apiLevel >= 40) retVal = 10
          // else if (apiLevel >= 10) retVal = 10
          else retVal = ANON_LIMITS

          // Normal indexer routes
        } else if (level30Routes.includes(resource)) {
          if (apiLevel >= 30) retVal = 10
          else retVal = ANON_LIMITS

          // Full node tier
        } else if (apiLevel >= 20) {
          retVal = 10

          // Free tier, full node only.
        } else {
          retVal = ANON_LIMITS
        }
      }

      return retVal
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/calcPoints()')
      // throw err
      retVal = ANON_LIMITS
    }

    return retVal
  }

  // This function parses the req.url property to identify what resource
  // the user is requesting.
  // This was created as a function so that it can be unit tested. Not sure
  // what kind of variations will be seen in production.
  getResource (url) {
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

  // Returns a boolean if the origin of the request matches a domain in the
  // whitelist.
  isInWhitelist (origin) {
    try {
      const retVal = false // Default value.

      if (!origin) return false

      // console.log(`WHITELIST_DOMAINS: ${JSON.stringify(WHITELIST_DOMAINS, null, 2)}`)

      for (let i = 0; i < WHITELIST_DOMAINS.length; i++) {
        const thisDomain = WHITELIST_DOMAINS[i]

        if (origin.toString().indexOf(thisDomain) > -1) {
          return true
        }
      }

      return retVal
    } catch (err) {
      wlogger.error(
        'Error in route-ratelimit.js/isInWhitelist(). Returning false by default.'
      )
      return false
    }
  }
}

module.exports = RateLimits
