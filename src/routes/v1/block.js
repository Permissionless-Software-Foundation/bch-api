"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const config = {
  blockRateLimit1: undefined,
  blockRateLimit2: undefined
}

let i = 1
while (i < 3) {
  config[`blockRateLimit${i}`] = new RateLimit({
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
  i++
}

router.get("/", config.blockRateLimit1, (req, res, next) => {
  res.json({ status: "block" })
})

router.get("/details/:id", config.blockRateLimit2, (req, res, next) => {
  if (req.params.id.length !== 64) {
    BitboxHTTP({
      method: "post",
      auth: {
        username: username,
        password: password
      },
      data: {
        jsonrpc: "1.0",
        id: "getblockhash",
        method: "getblockhash",
        params: [parseInt(req.params.id)]
      }
    })
      .then(response => {
        axios
          .get(`${process.env.BITCOINCOM_BASEURL}block/${response.data.result}`)
          .then(response => {
            const parsed = response.data
            res.json(parsed)
          })
          .catch(error => {
            //res.send(error.response.data.error.message)
            res.status(500)
            return res.send(error)
          })
      })
      .catch(error => {
        //res.send(error.response.data.error.message)
        res.status(500)
        return res.send(error)
      })
  } else {
    axios
      .get(`${process.env.BITCOINCOM_BASEURL}block/${req.params.id}`)
      .then(response => {
        const parsed = response.data
        res.json(parsed)
      })
      .catch(error => {
        //res.send(error.response.data.error.message)
        res.status(500)
        return res.send(error)
      })
  }
})

module.exports = router
