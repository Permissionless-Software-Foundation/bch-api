/*
  This middleware inspects the request header for a JWT token.
  If found, will populate req.locals.jwtToken with the JWT token.
*/

"use strict"

// This function searches the header for the a JWT token in the authorization header.
// If one is found, this middleware passes the JWT token through the
// req.locals.jwtToken property.
const getTokenFromHeaders = (req, res, next) => {
  try {
    // console.log(`getTokenFromHeaders2: Searching headers for a JWT token.`)

    // console.log(`req.headers: `, req.headers)

    // If the authorization header exists.
    if (req.headers.authorization) {
      const authStr = req.headers.authorization

      // If the header is proceeded by the word 'Token'
      if (authStr.split(" ")[0] === "Token") {
        const token = authStr.split(" ")[1]

        // console.log(`JWT found: ${token}`)

        // Create the req.locals property if it does not yet exist.
        if (!req.locals) req.locals = {}
        req.locals.jwtToken = token
      }
    }
  } catch (err) {
    console.log(`Error in getTokenFromHeaders2: `, err)
  }

  next()
}

const jwtAuth = {
  getTokenFromHeaders
}

module.exports = jwtAuth
