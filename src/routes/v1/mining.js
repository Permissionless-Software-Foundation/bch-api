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
  miningRateLimit1: undefined,
  miningRateLimit2: undefined,
  miningRateLimit3: undefined
}

let i = 1
while (i < 4) {
  config[`miningRateLimit${i}`] = new RateLimit({
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

router.get("/", config.miningRateLimit1, async (req, res, next) => {
  res.json({ status: "mining" })
})
//
// router.get('/getBlockTemplate/:templateRequest', (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getblocktemplate",
//       method: "getblocktemplate",
//       params: [
//         req.params.templateRequest
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });

router.get(
  "/getMiningInfo",
  config.miningRateLimit2,
  async (req, res, next) => {
    requestConfig.data.id = "getmininginfo"
    requestConfig.data.method = "getmininginfo"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getNetworkHashps",
  config.miningRateLimit3,
  async (req, res, next) => {
    requestConfig.data.id = "getnetworkhashps"
    requestConfig.data.method = "getnetworkhashps"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)
//
// router.post('/submitBlock/:hex', (req, res, next) => {
//   let parameters = '';
//   if(req.query.parameters && req.query.parameters !== '') {
//     parameters = true;
//   }
//
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"submitblock",
//       method: "submitblock",
//       params: [
//         req.params.hex,
//         parameters
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });

module.exports = router
