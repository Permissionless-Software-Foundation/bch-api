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
    // Only executes if the authorization header exists.
    if (req.headers.authorization) {
      // Retrieve the auth string from the header object.
      const authStr = req.headers.authorization

      // If the header is proceeded by the word 'Token'
      if (authStr.split(" ")[0] === "Token") {
        const token = authStr.split(" ")[1]

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
    console.log(`Error in getTokenFromHeaders: `, err)
  }

  next()
}

// This middleware analyizes the combination of JWT token and apiLevel. It will
// stop users from accessing routes they have not paid for.
//
// It is assumed this middleware is run AFTER the route-ratelimit.js middleware,
// so that the req.locals.apiLevel property has been populated.
const routeAccess = (req, res, next) => {
  try {
    // console.log(`req.locals: ${JSON.stringify(req.locals, null, 2)}`)
    console.log(`req.url: `, req.url)

    const locals = req.locals
    const url = req.url

    const level20Routes = ["insight", "bitcore", "blockbook"]

    // JWT token is included in header.
    if (!!locals.jwtToken && locals.jwtToken !== "") {
      // API Level is 0 (free tier): do nothing. All endpoints are open to
      // free public access within the drastically limited rate limits.

      if (locals.apiLevel < 20) {
        // API level does not include indexer access.

        // Loop through the routes that are not accessible to this tier.
        for (let i = 0; i < level20Routes.length; i++) {
          // If the requested route is for a higher tier, return a 403.
          if (url.indexOf(level20Routes[i]) > -1) {
            res.status(403)
            return res.json({
              error:
                "route is not accessible for your JWT tier. Upgrade or use anonymous access."
            })
          }
        }
      }
      // else if (locals.apiLevel > 11) {
      //   // API level is 20 (indexer tier)
      // }
    }
  } catch (err) {
    console.log(`Error in routeAccess: `, err)
  }

  next()
}

const jwtAuth = {
  getTokenFromHeaders,
  routeAccess
}

module.exports = jwtAuth
