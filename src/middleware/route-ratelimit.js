/*
  This file controls the request-per-minute (RPM) rate limits.

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

"use strict"

const express = require("express")
const RateLimit = require("express-rate-limit")
const axios = require("axios")

// Set max requests per minute
const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 3

// Pro-tier rate limits are 10x the freemium limits.
// const PRO_RPM = 10 * maxRequests

// Unique route mapped to its rate limit
const uniqueRateLimits = {}

const routeRateLimit = async function(req, res, next) {
  // Disable rate limiting if 0 passed from RATE_LIMIT_MAX_REQUESTS
  if (maxRequests === 0) return next()

  // Create a res.locals object if not passed in.
  if (!req.locals) {
    req.locals = {
      // default values
      jwtToken: "",
      proLimit: false,
      apiLevel: 0
    }
  }

  // Warn if JWT_AUTH_SERVER env var is not set.
  const authServer = process.env.JWT_AUTH_SERVER
  if (!authServer || authServer === "") {
    console.warn(
      "JWT_AUTH_SERVER env var is not set. JWT tokens not being evaluated."
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
        const userPermissions = evalUserPermissioins(req, jwtInfo)
        // console.log(
        //   `userPermissions: ${JSON.stringify(userPermissions, null, 2)}`
        // )

        req.locals.proLimit = userPermissions.proLimit
        req.locals.apiLevel = userPermissions.apiLevel
      }
    }
  }

  // Current route
  const rateLimitTier = req.locals.proLimit ? "PRO" : "BASIC"
  const path = req.baseUrl + req.path

  // Create a unique string as a route identifier.
  const route =
    rateLimitTier +
    req.method +
    req.locals.apiLevel + // Generates new rate limit when user upgrades JWT token.
    path
      .split("/")
      .slice(0, 4)
      .join("/")
  //console.log(`route identifier: ${JSON.stringify(route, null, 2)}`)

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
        handler: function(req, res) {
          //console.log(`pro-tier rate-handler triggered.`)

          res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
          return res.json({
            error: `Too many requests. Limits are ${PRO_RPM} requests per minute. Increase rate limits at https://account.bchjs.cash`
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
        handler: function(req, res) {
          //console.log(`freemium rate-handler triggered.`)

          res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
          return res.json({
            error: `Too many requests. Your limits are currently ${maxRequests} requests per minute. Increase rate limits at https://account.bchjs.cash`
          })
        }
      })
    }
  }

  //console.log(`calling uniqueRateLimits() on this route: ${route}`)

  // Call rate limit for this route
  uniqueRateLimits[route](req, res, next)
}

// This function returns the an object with proLimit and apiLevel properties.
// It does fine-grane analysis on the data coming from the auth servers and
// uses its output to adjust rate limits on-the-fly based on the users
// permission level.
function evalUserPermissioins(req, authData) {
  // console.log(`authData: ${JSON.stringify(authData, null, 2)}`)

  // Return object with default values
  const retObj = {
    proLimit: authData.isValid,
    apiLevel: authData.apiLevel
  }

  // if apiLevel = 0 (free tier), then return the default values.
  if (retObj.apiLevel === 0) return retObj

  const level20Routes = ["insight", "bitcore", "blockbook"]

  const locals = req.locals
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

module.exports = { routeRateLimit }
