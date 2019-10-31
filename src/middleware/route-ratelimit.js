/*
  This file controls the request-per-minute (RPM) rate limits.

  It is assumed that this middleware is run AFTER the auth.js middleware which
  checks for Basic auth. If the user adds the correct Basic auth to the header
  of their API request, they will get pro-tier rate limits. By default, the
  freemium rate limits apply.
*/

"use strict"

const express = require("express")
const RateLimit = require("express-rate-limit")
const axios = require("axios")

// Set max requests per minute
const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10

// Pro-tier rate limits are 10x the freemium limits.
const PRO_RPM = 10 * maxRequests

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

      const path = `${authServer}apitoken/isvalid/${req.locals.jwtToken}`

      let jwtInfo = await axios.get(path)
      jwtInfo = jwtInfo.data
      // console.log(`jwtInfo: ${JSON.stringify(jwtInfo, null, 2)}`)

      // Enable pro-tier rate limits if JWT if valid.
      if (jwtInfo.isValid) {
        // console.log(`JWT is valid. Enabling pro-tier rate limits.`)
        req.locals.proLimit = true
        req.locals.apiLevel = jwtInfo.apiLevel
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
    path
      .split("/")
      .slice(0, 4)
      .join("/")
  //console.log(`route identifier: ${JSON.stringify(route, null, 2)}`)

  // This boolean value is passed from the auth.js middleware.
  const proRateLimits = req.locals.proLimit

  // Pro level rate limits
  if (proRateLimits) {
    // TODO: replace the console.logs with calls to our logging system.
    //console.log(`applying pro-rate limits`)

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
            error: `Too many requests. Limits are ${PRO_RPM} requests per minute.`
          })
        }
      })
    }

    // Freemium level rate limits
  } else {
    // TODO: replace the console.logs with calls to our logging system.
    //console.log(`applying freemium limits`)

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
            error: `Too many requests. Limits are ${maxRequests} requests per minute.`
          })
        }
      })
    }
  }

  //console.log(`calling uniqueRateLimits() on this route: ${route}`)

  // Call rate limit for this route
  uniqueRateLimits[route](req, res, next)
}

module.exports = { routeRateLimit }
