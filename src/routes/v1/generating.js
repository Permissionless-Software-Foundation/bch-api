"use strict"

const express = require("express")
const router = express.Router()
//const axios = require("axios");
const RateLimit = require("express-rate-limit")

//const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default;
//const BITBOX = new BITBOXCli();

//const BitboxHTTP = axios.create({
//  baseURL: process.env.RPC_BASEURL,
//});
//const username = process.env.RPC_USERNAME;
//const password = process.env.RPC_PASSWORD;

const config = {
  generatingRateLimit1: undefined
}

let i = 1
while (i < 2) {
  config[`generatingRateLimit${i}`] = new RateLimit({
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

router.get("/", config.generatingRateLimit1, (req, res, next) => {
  res.json({ status: "generating" })
})
//
// router.post('/generateToAddress/:nblocks/:address', (req, res, next) => {
//   let maxtries = 1000000;
//   if(req.query.maxtries) {
//     maxtries = parseInt(req.query.maxtries);
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
//       id:"generatetoaddress",
//       method: "generatetoaddress",
//       params: [
//         req.params.nblocks,
//         req.params.address,
//         maxtries
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
