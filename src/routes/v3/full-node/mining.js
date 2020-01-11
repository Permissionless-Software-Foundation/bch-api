"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")

const routeUtils = require("../route-utils")
const wlogger = require("../../../util/winston-logging")

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

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

router.get("/", root)
router.get("/getMiningInfo", getMiningInfo)
router.get("/getNetworkHashps", getNetworkHashPS)

function root(req, res, next) {
  return res.json({ status: "mining" })
}

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
/**
 * @api {get} /mining/getMiningInfo  Get Mining Info.
 * @apiName Mining info.
 * @apiGroup Mining
 * @apiDescription Returns a json object containing mining-related information.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/mining/getMiningInfo" -H "accept: application/json"
 *
 *
 */
async function getMiningInfo(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getmininginfo"
    requestConfig.data.method = "getmininginfo"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in mining.ts/getMiningInfo().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}
/**
 * @api {get} /mining/getNetworkHashps?nblocks=&height=  Get Estimated network hashes per second.
 * @apiName Estimated network hashes per second.
 * @apiGroup Mining
 * @apiDescription Returns the estimated network hashes per second based on the last n blocks. Pass in [blocks] to override # of blocks, -1 specifies since last difficulty change. Pass in [height] to estimate the network speed at the time when a certain block was found.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/mining/getNetworkHashps?nblocks=120&height=-1" -H "accept: application/json"
 *
 *
 */
async function getNetworkHashPS(req, res, next) {
  try {
    let nblocks = 120 // Default
    let height = -1 // Default
    if (req.query.nblocks) nblocks = parseInt(req.query.nblocks)
    if (req.query.height) height = parseInt(req.query.height)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getnetworkhashps"
    requestConfig.data.method = "getnetworkhashps"
    requestConfig.data.params = [nblocks, height]

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in mining.ts/getNetworkHashPS().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

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

module.exports = {
  router,
  testableComponents: {
    root,
    getMiningInfo,
    getNetworkHashPS
  }
}
