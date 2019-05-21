"use strict"

const express = require("express")
const router = express.Router()
const RateLimit = require("express-rate-limit")

const config = {
  indexRateLimit1: undefined
}

let i = 1
while (i < 2) {
  config[`indexRateLimit${i}`] = new RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
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
  i++
}

/* GET home page. */
router.get("/v1", config.indexRateLimit1, (req, res, next) => {
  res.render("swagger")
})

module.exports = router
