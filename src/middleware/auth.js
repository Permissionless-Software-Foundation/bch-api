/*
  CT 2/4/20 Note: This library handles anonymous and Basic auth. This library
  can be phased out with the chage to JWT tokens and the new rate-limit library.

  Handle authorization for bypassing rate limits.

  1) Default is 'Anonymous Authentication', which unlocks the freemimum tier by
  default.
  2) Hard-coded 'Basic Authentication' is a token that does not expire and is
  provided to buisiness partners.
  3) JWT-based 'Local Authentication' is used for normal users that pay to
  access the premium pro-tier services.

  This file uses the passport npm library to check the header of each REST API
  call for the prescence of a Basic authorization header:
  https://en.wikipedia.org/wiki/Basic_access_authentication

  If the header is found and validated, the req.locals.proLimit Boolean value
  is set and passed to the route-ratelimits.ts middleware.
*/

'use strict'

const passport = require('passport')
// const BasicStrategy = require('passport-http').BasicStrategy
const AnonymousStrategy = require('passport-anonymous')
// const wlogger = require('../util/winston-logging')

// Used for debugging and iterrogating JS objects.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// let _this

// Set default rate limit value for testing
// const PRO_PASSES = process.env.PRO_PASS ? process.env.PRO_PASS : 'BITBOX'
// Convert the pro-tier password string into an array split by ':'.
// const PRO_PASS = PRO_PASSES.split(':')

// wlogger.verbose(`PRO_PASS set to: ${PRO_PASS}`)

// Auth Middleware
class AuthMW {
  constructor () {
    // _this = this

    // Initialize passport for 'anonymous' authentication.
    passport.use(new AnonymousStrategy())

    // Initialize passport for 'basic' authentication.
    //   passport.use(
    //     new BasicStrategy({ passReqToCallback: true }, function (
    //       req,
    //       username,
    //       password,
    //       done
    //     ) {
    //       // console.log(`req: ${util.inspect(req)}`)
    //       // console.log(`username: ${username}`)
    //       // console.log(`password: ${password}`)
    //
    //       // Create the req.locals property if it does not yet exist.
    //       if (!req.locals) {
    //         req.locals = {
    //           // default values
    //           proLimit: false,
    //           apiLevel: 0
    //         }
    //       }
    //
    //       // Set pro-tier rate limit to flag to false by default.
    //       req.locals.proLimit = false
    //
    //       // Evaluate the username and password and set the rate limit accordingly.
    //       // if (username === "BITBOX" && password === PRO_PASS) {
    //       if (username === 'BITBOX') {
    //         for (let i = 0; i < PRO_PASS.length; i++) {
    //           const thisPass = PRO_PASS[i]
    //
    //           if (password === thisPass) {
    //             wlogger.verbose(`${req.url} called by ${password.slice(0, 6)}`)
    //
    //             // Success
    //             req.locals.proLimit = true
    //             break
    //           }
    //         }
    //       }
    //
    //       // console.log(`req.locals: ${util.inspect(req.locals)}`)
    //
    //       return done(null, true)
    //     })
    //   )
  }

  // Middleware called by the route.
  mw () {
    return passport.authenticate(['anonymous'], {
      session: false
    })
  }
}

module.exports = AuthMW
