/*
Sets the rate limits for the anonymous and paid tiers. Current rate limits:
- 10000 points in 60 seconds
- 500 points per call for anonymous tier (20 RPM)
- 100 points per call for tier 40 (100 RPM)
- 40 points per call for tier 50 (250 RPM)
- 16 points per call for tier 60 (625 RPM)

The rate limit handling is designed for these four use cases:
- Users who want to buy a JWT token for 24 hour access.
- Users who want to buy different RPM tiers: 100, 250, 600
- Basic Authentication which should not have any rate limits applied.
- Local installations that do not want any authentication or rate limits at all.

The Basic Auth use cases is considered when determining internal rate limits.
The internal rate limits should not be applied to calls from those users.

A lot of attention has been paid to passing rate-limit information for the user
when they trigger an endpoint that makes a lot of internal API calls. Examples
are hydrateUtxos() and getPublicKey(). These keeps things fair by charging the
same for 'light' API calls and 'heavy' API calls.

TODO:
- Add code for applying rate limits to whitelist domains.
*/

// Public npm libraries.
const jwt = require('jsonwebtoken')
const Redis = require('ioredis')
const { RateLimiterRedis } = require('rate-limiter-flexible')

// local libraries.
const wlogger = require('../util/winston-logging')
const config = require('../../config')

let _this // Global pointer to instance of class, when 'this' context is lost.

// Setup Redis to track rate limits for each user.
const redisOptions = {
  enableOfflineQueue: false,
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379,
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1'
}
const redisClient = new Redis(redisOptions)
const rateLimitOptions = {
  storeClient: redisClient,
  points: config.pointsPerMinute, // Number of points
  duration: 60 // Per minute (per 60 seconds)
}

// Constants
const ANON_LIMITS = config.anonRateLimit
// const WHITELIST_RATE_LIMIT = config.whitelistRateLimit
const WHITELIST_DOMAINS = config.whitelistDomains
const WHITELIST_POINTS_TO_CONSUME = config.whitelistRateLimit
const POINTS_PER_MINUTE = config.pointsPerMinute
const INTERNAL_POINTS_TO_CONSUME = config.internalRateLimit

class RateLimits {
  constructor () {
    _this = this

    this.jwt = jwt
    this.rateLimiter = new RateLimiterRedis(rateLimitOptions)
    this.config = config
  }

  // This is the main middleware funciton of this library. All other functions
  // support this function.
  async applyRateLimits (req, res, next) {
    try {
      // Exit if the user has already authenticated with Basic Authentication.
      if (req.locals.proLimit) {
        console.log('External call, basic auth, skipping rate limits.')
        wlogger.debug(
          'req.locals.proLimit = true; Using Basic Authentication instead of rate limits'
        )
        return next()
      }

      // Determine if the call is an external or internal API call.
      const isInternal = _this.checkInternalIp(req)
      // console.log(`isInternal: ${isInternal}`)

      // Determine if the call originates from another computer on the intranet.
      const isWhitelistOrigin = _this.isInWhitelist(req)
      // console.log('isWhitelistOrigin: ', isWhitelistOrigin)

      // Handle the use case of internally-generated requests.
      if (isInternal) {
        // Internal API calls should pass the authentication data in through the
        // the usrObj in the body.
        if (req.body && req.body.usrObj) {
          if (req.body.usrObj.proLimit) {
            // console.log('Internal call, basic auth, skipping rate limits.')

            // If this is an internal call that originated from a user using
            // Basic Authentication, then skip rate-limits.
            return next()
          } else {
            // console.log(
            //   'Internal call, applying rate limits. Using JWT if available.'
            // )

            // Determine if user has exceeded their rate limits. Pass in the
            // JWT token if one exists.
            const hasExceededRateLimit = await _this.trackRateLimits(
              req,
              res,
              req.body.usrObj.jwtToken
            )

            if (!hasExceededRateLimit) {
              // Rate limits have not been exceeded. Processing can continue.
              return next()
            } else {
              // trackRateLimits() returns the 'res' object with an error message
              // and status code.
              return hasExceededRateLimit
            }
          }
        } else {
          // This should be a corner case. Calls should not be going into this
          // code path, so the system should throw up big warning signs when they
          // do.
          // This code path happens when an internal call is made but does not
          // pass the usrObj. Legacy code needs to be refactored to use the usrObj
          // and avoid this code path. This code path is 'pooled': all users
          // share the same rate limits. Even at 1000 RPM, this pool will get
          // exhausted easily.
          // const warnMsg =
          //   'Internal call. req.body.usrObj does not exist. Applying high-speed internal rate limits.'
          // console.log(warnMsg)
          // wlogger.info(warnMsg)

          const defaultPayload = {
            id: '98.76.54.32',
            email: 'internal@bchtest.net',
            apiLevel: 40,
            rateLimit: 100,
            pointsToConsume: INTERNAL_POINTS_TO_CONSUME,
            duration: 30
          }

          // Default values, in case there is an error.
          const defaultJwt = _this.generateJwtToken(defaultPayload)

          // Track the rate limit for this user. Pass in the JWT token, if one
          // is available.
          const hasExceededRateLimit = await _this.trackRateLimits(
            req,
            res,
            defaultJwt
          )
          // console.log(`hasExceededRateLimit: `, hasExceededRateLimit)

          if (!hasExceededRateLimit) {
            // Rate limits have not been exceeded. Processing can continue.
            return next()
          } else {
            // trackRateLimits() returns the 'res' object with an error message
            // and status code.
            return hasExceededRateLimit
          }
        }
        //
        //
      } else {
        // Handle the normal use-case of external requests
        // console.log(
        //   'External call, applying rate limits. Using JWT if available.'
        // )

        // For calls originating from a whitelist domain, apply a high-RPM
        // JWT token to the call.
        if (isWhitelistOrigin) {
          const defaultPayload = {
            id: '77.77.77.77',
            email: 'whitelist@bchtest.net',
            apiLevel: 40,
            rateLimit: 100,
            pointsToConsume: WHITELIST_POINTS_TO_CONSUME,
            duration: 30
          }

          // Inject the high-RPM JWT token into the call.
          req.locals.jwtToken = _this.generateJwtToken(defaultPayload)
        }

        // Track the rate limit for this user. Pass in the JWT token, if one
        // is available.
        const hasExceededRateLimit = await _this.trackRateLimits(
          req,
          res,
          req.locals.jwtToken
        )
        // console.log('hasExceededRateLimit: ', hasExceededRateLimit)

        if (!hasExceededRateLimit) {
          // Rate limits have not been exceeded. Processing can continue.
          return next()
        } else {
          // trackRateLimits() returns the 'res' object with an error message
          // and status code.
          return hasExceededRateLimit
        }
      }
    } catch (err) {
      wlogger.error('Error in route-ratelimit2.js/applyRateLimits(): ', err)
    }

    // By default, move to the next middleware.
    next()
  }

  // A wrapper for Redis-based rate limiter.
  // Will return false if the user has not exceeded the rate limit. Otherwise
  // it will return the 'res' object with an error status and message, which
  // should be returned by the middleware.
  async trackRateLimits (req, res, jwtToken) {
    const debugInfo = {
      jwtToken,
      userObj: req.body.usrObj,
      locals: req.locals
    }

    // Anonymous rate limits are used by default.
    let pointsToConsume = ANON_LIMITS
    // console.log('pointsToConsume: ', pointsToConsume)

    let key = req.ip // Use the IP address as the key, by default.
    debugInfo.ip = req.ip

    // console.log('jwtToken: ', jwtToken)

    try {
      // Decode the JWT token if it exists
      if (jwtToken) {
        const decoded = _this.decodeJwtToken(jwtToken)
        // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

        // Preferentially use the decoded ID in the JWT payload, as the key.
        key = decoded.id
        debugInfo.id = key

        pointsToConsume = decoded.pointsToConsume
        debugInfo.pointsToConsume = pointsToConsume
      }
      // console.log(`rate limit key: ${key}`)

      // This function will throw an error if the user exceeds the rate limit.
      // The 429 error response is handled by the catch().
      await _this.rateLimiter.consume(key, pointsToConsume)

      // Debugging
      // const rateLimitData = await _this.rateLimiter.consume(key, pointsToConsume)
      // console.log(`rateLimitData: `, rateLimitData)

      // Add data to logs for analytics.
      const logData = {
        ip: req.ip,
        key,
        pointsToConsume,
        status: 'OK'
      }
      wlogger.info(logData)

      res.locals.pointsToConsume = pointsToConsume // Feedback for tests.

      // Signal that the user has not exceeded their rate limits.
      return false
    } catch (err) {
      // console.log('err: ', err)

      const rateLimit = Math.floor(POINTS_PER_MINUTE / pointsToConsume)

      res.locals.rateLimitTriggered = true
      // console.log('res.locals: ', res.locals)

      // console.log(
      //   `rate limit debug info: ${JSON.stringify(debugInfo, null, 2)}`
      // )

      // Add data to logs for analytics.
      const logData = {
        ip: req.ip,
        key,
        pointsToConsume,
        status: 429
      }
      wlogger.info(logData)

      // Rate limited was triggered
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Too many requests. Your limits are currently ${rateLimit} requests per minute. Increase rate limits at https://fullstack.cash`
      })
    }
  }

  // Attempts to decode a JWT token. Returns default values if it fails.
  decodeJwtToken (jwtToken) {
    const defaultPayload = {
      id: '123.456.789.10',
      email: 'test@bchtest.net',
      apiLevel: 10,
      rateLimit: 3,
      pointsToConsume: ANON_LIMITS,
      duration: 30
    }

    try {
      // Default values, in case there is an error.
      const defaultJwt = _this.generateJwtToken(defaultPayload)

      // Generate a default payload to use, if the decoding of the user-provided
      // jwt fails.
      let decoded = _this.jwt.verify(defaultJwt, _this.config.apiTokenSecret)

      try {
        decoded = _this.jwt.verify(jwtToken, _this.config.apiTokenSecret)
      } catch (err) {
        wlogger.error('Error in route-ratelimit2.js/decodeJwtTokens(): ', err)
      }

      return decoded
    } catch (err) {
      wlogger.error(
        'Unhandled error in route-ratelimit2.js/deocdeJwtToken: ',
        err
      )

      // Making sure there is an exp property. Not sure if this will cause an
      // issue, using a hard-coded value.
      defaultPayload.exp = 1574269450

      return defaultPayload
    }
  }

  // Returns a boolean if the origin of the request matches a domain in the
  // whitelist.
  isInWhitelist (req) {
    try {
      const retVal = false // Default value.

      // Retrieve the origin.
      const origin = req.get('origin')

      if (!process.env.TEST) console.log('origin:', origin)

      // If the origin is not determinable, return false.
      if (!origin) return false

      // console.log(`WHITELIST_DOMAINS: ${JSON.stringify(WHITELIST_DOMAINS, null, 2)}`)

      for (let i = 0; i < WHITELIST_DOMAINS.length; i++) {
        const thisDomain = WHITELIST_DOMAINS[i]

        if (origin.includes(thisDomain)) return true
      }

      return retVal
    } catch (err) {
      wlogger.error(
        'Error in route-ratelimit.js/isInWhitelist(). Returning false by default.'
      )
      return false
    }
  }

  // Checks the request object to see if it's IP address matches an internal
  // IP address. That means the call is an internal API call and should be
  // treated differently than an external API call.
  checkInternalIp (req) {
    try {
      // Default value
      let isInternal = false

      const ip = req.ip

      if (ip.includes('127.0.0.1')) isInternal = true

      if (ip.includes('172.17.')) isInternal = true

      // TODO: Add 192.168.

      return isInternal
    } catch (err) {
      wlogger.error(
        'Error in checkInternalIp(). Returning false be default. Err: ',
        err
      )
      return false
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

  // Generates a JWT token for testing purposes. This is not used in production.
  // This function mirrors the kind of JWT token that would be generated by
  // jwt-bch-api.
  generateJwtToken (payload) {
    try {
      const jwtOptions = {
        expiresIn: '30 days'
      }

      const token = _this.jwt.sign(
        payload,
        _this.config.apiTokenSecret,
        jwtOptions
      )

      return token
    } catch (err) {
      console.error('Error in generateJwtToken()')
      throw err
    }
  }

  // Called when rate limits are not used.
  populateLocals (req, res, next) {
    try {
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

      next()
    } catch (err) {
      console.error('Error in populateLocals(): ', err)
      throw err
    }
  }
}

module.exports = RateLimits
