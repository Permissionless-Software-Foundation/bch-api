"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const routeUtils = require("./route-utils")
const logger = require("./logging.js")
const wlogger = require("../../util/winston-logging")

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const requestConfig: IRequestConfig = {
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

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getMiningInfo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getNetworkHashPS(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
