/*
  Insight API route
  A parent route that encompases the other libraries.
*/

"use strict"

const express = require("express")
const requestUtils = require("../services/requestUtils")
const axios = require("axios")
const routeUtils = require("../route-utils")
const wlogger = require("../../../util/winston-logging")

const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

//const BCHJS = require("@chris.troutner/bch-js")
//const bchjs = new BCHJS()

//const BITCORE_URL = process.env.BITCORE_URL

// Connect the route endpoints to their handler functions.
router.get("/", root)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

module.exports = {
  router,
  testableComponents: {
    root
  }
}
