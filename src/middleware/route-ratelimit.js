'use strict'

// const express = require('express')
const RateLimit = require('express-rate-limit')
const axios = require('axios')

const wlogger = require('../util/winston-logging')

const jwt = require('jsonwebtoken')
const KeyEncoder = require('key-encoder').default
const keyEncoder = new KeyEncoder('secp256k1')

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
  points: 100, // Number of points
  duration: 1 // Per second
}

// This hard-coded value is temporary. It will be swapped out with an environment
// variable when moved to production.
const publicKey =
  '03e6c358092a459f7da9420de770eef3e16cf3c9c54a3d3d14ac2d7f0b82af4d7d'

// Set max requests per minute
const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 3

// Pro-tier rate limits are 10x the freemium limits.
// const PRO_RPM = 10 * maxRequests

// Unique route mapped to its rate limit
const uniqueRateLimits = {}

let _this

class RateLimits {
  constructor () {
    _this = this

    this.jwt = jwt
    this.rateLimiter = new RateLimiterRedis(rateLimitOptions)
  }

  // Used to disconnect from the Redis DB.
  // Called by unit tests so that node.js thread doesn't live forever.
  closeRedis () {
    redisClient.disconnect()
  }

  // CT 2/7/20: Older rate-limiting code that does not scale well.
  /*
    This function controls the tierd request-per-minute (RPM) rate limits.
    This is an older implementation that is currently not used.

    It is assumed that this middleware is run AFTER the jwt-auth.js and auth.js
    middleware.

    Current rate limiting rules in requests-per-minute:
    - anonymous access: 3
    - free access: 10, apiLevel = 0
    - any paid tier: 100, apiLevel > 0

    If a person signs up for full node access but not indexer access, then the
    apiLevel will be 10. If they call an endpoint that uses an indexer, the apiLevel
    will be downgraded to 0 on-the-fly. Indexer endpoints will effectively be
    downgraded to the anonymous access tier.
  */
  async routeRateLimit (req, res, next) {
    // Disable rate limiting if 0 passed from RATE_LIMIT_MAX_REQUESTS
    if (maxRequests === 0) return next()

    // Create a res.locals object if not passed in.
    if (!req.locals) {
      req.locals = {
        // default values
        jwtToken: '',
        proLimit: false,
        apiLevel: 0
      }
    }

    // Warn if JWT_AUTH_SERVER env var is not set.
    const authServer = process.env.JWT_AUTH_SERVER
    if (!authServer || authServer === '') {
      console.warn(
        'JWT_AUTH_SERVER env var is not set. JWT tokens not being evaluated.'
      )
    } else {
      // If a JWT token is passed in, validate it and enable pro-tier rate limits
      // if it's valid.
      if (req.locals.jwtToken) {
        // console.log(`req.locals.jwtToken: ${req.locals.jwtToken}`)

        // URL for the auth server.
        const path = `${authServer}apitoken/isvalid/${req.locals.jwtToken}`

        // Ask Auth server if the JWT token is valid.
        // Get the API level for this user.
        let jwtInfo = await axios.get(path)
        jwtInfo = jwtInfo.data
        // console.log(`jwtInfo: ${JSON.stringify(jwtInfo, null, 2)}`)

        // If JWT if valid, evaluate the API level for the user.
        if (jwtInfo.isValid) {
          // Set fine-grain permissions for each user based on the JWT token.
          const userPermissions = _this.evalUserPermissioins(req, jwtInfo)
          // console.log(
          //   `userPermissions: ${JSON.stringify(userPermissions, null, 2)}`
          // )

          req.locals.proLimit = userPermissions.proLimit
          req.locals.apiLevel = userPermissions.apiLevel
        }
      }
    }

    // Current route
    const rateLimitTier = req.locals.proLimit ? 'PRO' : 'BASIC'
    const path = req.baseUrl + req.path

    // Create a unique string as a route identifier.
    const route =
      rateLimitTier +
      req.method +
      req.locals.apiLevel + // Generates new rate limit when user upgrades JWT token.
      path
        .split('/')
        .slice(0, 4)
        .join('/')
    // console.log(`route identifier: ${JSON.stringify(route, null, 2)}`)

    // console.log(`req.locals: ${JSON.stringify(req.locals, null, 2)}`)

    // This boolean value is passed from the auth.js middleware.
    const proRateLimits = req.locals.proLimit

    // console.log(`proRateLimits: ${proRateLimits}`)

    // Pro level rate limits
    if (proRateLimits || proRateLimits === 0) {
      // TODO: replace the console.logs with calls to our logging system.
      // console.log(`applying pro-rate limits`)

      let PRO_RPM = 10 // Default value for free tier
      if (req.locals.apiLevel > 0) PRO_RPM = 100 // RPM for paid tiers.

      // console.log(`PRO_RPM: ${PRO_RPM}, apiLevel: ${req.locals.apiLevel}`)

      // Create new RateLimit if none exists for this route
      if (!uniqueRateLimits[route]) {
        uniqueRateLimits[route] = new RateLimit({
          windowMs: 60 * 1000, // 1 minute window
          delayMs: 0, // disable delaying - full speed until the max limit is reached
          max: PRO_RPM, // start blocking after this many requests per minute
          handler: function (req, res) {
            // console.log(`pro-tier rate-handler triggered.`)

            res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
            return res.json({
              error: `Too many requests. Limits are ${PRO_RPM} requests per minute. Increase rate limits at https://fullstack.cash`
            })
          }
        })
      }

      // Freemium level rate limits
    } else {
      // TODO: replace the console.logs with calls to our logging system.
      // console.log(`applying freemium limits`)

      // Create new RateLimit if none exists for this route
      if (!uniqueRateLimits[route]) {
        uniqueRateLimits[route] = new RateLimit({
          windowMs: 60 * 1000, // 1 minute window
          delayMs: 0, // disable delaying - full speed until the max limit is reached
          max: maxRequests, // start blocking after maxRequests
          handler: function (req, res) {
            // console.log(`freemium rate-handler triggered.`)

            res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
            return res.json({
              error: `Too many requests. Your limits are currently ${maxRequests} requests per minute. Increase rate limits at https://fullstack.cash`
            })
          }
        })
      }
    }

    // console.log(`calling uniqueRateLimits() on this route: ${route}`)

    // Call rate limit for this route
    uniqueRateLimits[route](req, res, next)
  }

  // CT 2/7/20: I believe this is older code that is only used by routeRateLimit.
  // It will probably be removed in the future.
  // This function returns an object with proLimit and apiLevel properties.
  // It does fine-grane analysis on the data coming from the auth servers and
  // uses its output to adjust rate limits on-the-fly based on the users
  // permission level.
  evalUserPermissioins (req, authData) {
    // console.log(`authData: ${JSON.stringify(authData, null, 2)}`)

    // Return object with default values
    const retObj = {
      proLimit: authData.isValid,
      apiLevel: authData.apiLevel
    }

    // if apiLevel = 0 (free tier), then return the default values.
    if (retObj.apiLevel === 0) return retObj

    const level20Routes = ['insight', 'bitcore', 'blockbook']

    // const locals = req.locals
    // console.log(`locals: ${JSON.stringify(locals, null, 2)}`)
    const url = req.url
    // console.log(`url: ${JSON.stringify(url, null, 2)}`)

    if (authData.apiLevel < 20) {
      // Loop through the routes that are not accessible to this tier.
      for (let i = 0; i < level20Routes.length; i++) {
        // If the requested route is for a higher tier,
        // revert to anonymous level permissions.
        if (url.indexOf(level20Routes[i]) > -1) {
          retObj.proLimit = false
          retObj.apiLevel = 0
        }
      }
    }

    return retObj
  }

  // This is the new rate limit function that uses the rate-limiter-flexible npm
  // library. It uses fine-grain rate limiting based on the resources being
  // consumed.
  async rateLimitByResource (req, res, next) {
    try {
      let userId
      let decoded = {}

      // Create a res.locals object if not passed in.
      if (!req.locals) {
        req.locals = {
          // default values
          jwtToken: '',
          proLimit: false,
          apiLevel: 0
        }
      }

      // Decode the JWT token if one exists.
      if (req.locals.jwtToken) {
        const jwtOptions = {
          algorithms: ['ES256']
        }

        const pemPublicKey = keyEncoder.encodePublic(publicKey, 'raw', 'pem')

        // Validate the JWT token.
        decoded = _this.jwt.verify(
          req.locals.jwtToken,
          pemPublicKey,
          jwtOptions
        )
        // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

        userId = decoded.id
      } else {
        wlogger.debug('No JWT token found!')
      }

      // Code here for the rate limiter is adapted from this example:
      // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#authorized-and-not-authorized-users
      try {
        // The resource being consumed: full node, indexer, SLPDB, etc.
        const resource = _this.getResource(req.url)
        wlogger.debug(`resource: ${resource}`)

        let key = userId || req.ip

        // const pointsToConsume = userId ? 1 : 30
        decoded.resource = resource
        const pointsToConsume = _this.calcPoints(decoded)

        wlogger.info(
          `User ${key} consuming ${pointsToConsume} point for resource ${resource}.`
        )

        // Update the key so that rate limits track both the user and the resource.
        key = `${key}-${resource}`

        await _this.rateLimiter.consume(key, pointsToConsume)
      } catch (err) {
        // console.log(`err: `, err)

        // Rate limited was triggered
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: `Too many requests. Your limits are currently ${maxRequests} requests per minute. Increase rate limits at https://fullstack.cash`
        })
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
    let retVal = 30 // By default, use anonymous tier.

    try {
      // console.log(`jwtInfo: ${JSON.stringify(jwtInfo, null, 2)}`)

      const apiLevel = jwtInfo.apiLevel
      const resource = jwtInfo.resource

      const level30Routes = ['insight', 'bitcore', 'blockbook']
      const level40Routes = ['slp']

      wlogger.debug(`apiLevel: ${apiLevel}`)

      // Only evaluate if user is using a JWT token.
      if (jwtInfo.id) {
        // SLP indexer routes
        if (level40Routes.includes(resource)) {
          if (apiLevel >= 40) retVal = 1
          // else if (apiLevel >= 10) retVal = 10
          else retVal = 10

          // Normal indexer routes
        } else if (level30Routes.includes(resource)) {
          if (apiLevel >= 30) retVal = 1
          else retVal = 10

          // Full node tier
        } else if (apiLevel >= 20) {
          retVal = 1

          // Free tier, full node only.
        } else {
          retVal = 10
        }
      }

      return retVal
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/calcPoints()')
      // throw err
      retVal = 30
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

  // This is a variation of rateLimitByResource() function. This version will
  // potentially be used by Bitcoin.com.
  // Rather than using apiLevel, the rateLimit is explicitly recorded in the
  // JWT token.
  async rateLimitSimple (req, res, next) {
    try {
      let userId
      let decoded = {}

      // Create a res.locals object if not passed in.
      if (!req.locals) {
        req.locals = {
          // default values
          jwtToken: '',
          proLimit: false,
          rateLimit: 3
        }
      }

      // Decode the JWT token if one exists.
      if (req.locals.jwtToken) {
        const jwtOptions = {
          algorithms: ['ES256']
        }

        const pemPublicKey = keyEncoder.encodePublic(publicKey, 'raw', 'pem')

        // Validate the JWT token.
        decoded = _this.jwt.verify(
          req.locals.jwtToken,
          pemPublicKey,
          jwtOptions
        )
        // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

        userId = decoded.id
      } else {
        wlogger.debug('No JWT token found!')
      }

      // Code here for the rate limiter is adapted from this example:
      // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#authorized-and-not-authorized-users
      try {
        // Key for Redis key/value pair.
        const key = userId || req.ip

        const pointsToConsume = _this.calcPoints2(decoded)

        wlogger.debug(`User ${key} consuming ${pointsToConsume}.`)

        await _this.rateLimiter.consume(key, pointsToConsume)
      } catch (err) {
        // console.log(`err: `, err)

        // Rate limited was triggered
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: `Too many requests. Your limits are currently ${maxRequests} requests per minute. Increase rate limits at https://fullstack.cash`
        })
      }
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/rateLimitSimple(): ', err)
      // throw err
    }

    next()
  }

  // Calculates the points consumed, based on the explicit rateLimit defined
  // in the JWT token.
  calcPoints2 (jwtInfo) {
    let retVal = 30 // By default, use anonymous tier.

    try {
      // console.log(`jwtInfo: ${JSON.stringify(jwtInfo, null, 2)}`)

      const MAX_RATE_LIMIT = 100

      const rateLimit = jwtInfo.rateLimit

      // Only evaluate if user is using a JWT token.
      if (jwtInfo.id) {
        const points = Math.floor(MAX_RATE_LIMIT / rateLimit)

        retVal = points
      }
    } catch (err) {
      wlogger.error('Error in route-ratelimit.js/calcPoints2()')
      // throw err
      retVal = 30
    }

    return retVal
  }
}

module.exports = RateLimits
