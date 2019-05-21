"use strict"

const express = require("express")
const router = express.Router()
const RateLimit = require("express-rate-limit")

const healthCheckRateLimit = new RateLimit({
  windowMs: 60000, // 1 hour window
  delayMs: 0, // disable delaying - full speed until the max limit is reached
  max: 60, // start blocking after 60 requests
  handler: function(req, res /*next*/) {
    res.format({
      json: function() {
        res.status(500).json({
          error: "Too many requests. Limits are 60 requests per minute."
        })
      }
    })
  }
})

/* GET home page. */
router.get("/", healthCheckRateLimit, (req, res, next) => {
  res.json({ status: "winning" })
})

module.exports = router
