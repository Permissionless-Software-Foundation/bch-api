/*
  This is a middleware library for handling and processing JWT tokens.

  This middleware inspects the request header for a JWT token.
  If found, will populate req.locals.jwtToken with the JWT token.
*/

'use strict'

// This function searches the header for the a JWT token in the authorization header.
// If one is found, this middleware passes the JWT token through the
// req.locals.jwtToken property.
const getTokenFromHeaders = (req, res, next) => {
  try {
    // console.log('req.headers: ', req.headers)

    // Only executes if the authorization header exists.
    if (req.headers.authorization) {
      // Retrieve the auth string from the header object.
      const authStr = req.headers.authorization

      // If the header is proceeded by the word 'Token'
      if (authStr.split(' ')[0] === 'Token') {
        const token = authStr.split(' ')[1]

        // console.log(`JWT found: ${token}`)

        // Create the req.locals property if it does not yet exist.
        if (!req.locals) {
          req.locals = {
            jwtToken: token,
            proLimit: false,
            apiLevel: 0
          }
        } else {
          req.locals.jwtToken = token
        }
      }
    }
  } catch (err) {
    console.log('Error in getTokenFromHeaders: ', err)
  }

  next()
}

const jwtAuth = {
  getTokenFromHeaders
}

module.exports = jwtAuth
