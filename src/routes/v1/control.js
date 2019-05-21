"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")

//const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default;
//const BITBOX = new BITBOXCli();

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const config = {
  controlRateLimit1: undefined,
  controlRateLimit2: undefined
}

let i = 1
while (i < 3) {
  config[`controlRateLimit${i}`] = new RateLimit({
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

const requestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

router.get("/", config.controlRateLimit1, async (req, res, next) => {
  res.json({ status: "control" })
})

router.get("/getInfo", config.controlRateLimit2, async (req, res, next) => {
  requestConfig.data.id = "getinfo"
  requestConfig.data.method = "getinfo"
  requestConfig.data.params = []

  try {
    const response = await BitboxHTTP(requestConfig)
    res.json(response.data.result)
  } catch (error) {
    res.status(500).send(error.response.data.error)
  }
})

// router.get('/getMemoryInfo', (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getmemoryinfo",
//       method: "getmemoryinfo"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/help', (req, res, next) => {
//   BITBOX.Control.help()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/stop', (req, res, next) => {
//   BITBOX.Control.stop()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });

module.exports = router
