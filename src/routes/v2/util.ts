"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const routeUtils = require("./route-utils")
const logger = require("./logging.js")
const wlogger = require("../../util/winston-logging")

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

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
router.get(
  "/validateAddress/:address",
  validateAddressSingle
)
router.post("/validateAddress", validateAddressBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "util" })
}

async function validateAddressSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "validateaddress"
    requestConfig.data.method = "validateaddress"
    requestConfig.data.params = [address]

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in util.ts/validateAddressSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function validateAddressBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let addresses = req.body.addresses

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the array.
    for(let i=0; i < addresses.length; i++) {
      const address = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        var legacyAddr = BITBOX.Address.toLegacyAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    logger.debug(`Executing util/validate with these addresses: `, addresses)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    // Loop through each address and creates an array of requests to call in parallel
    const promises = addresses.map(async (address: any) => {

      requestConfig.data.id = "validateaddress"
      requestConfig.data.method = "validateaddress"
      requestConfig.data.params = [address]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel Insight requests to return.
    const axiosResult: Array<any> = await axios.all(promises)

    // Retrieve the data part of the result.
    const result = axiosResult.map(x => x.data.result)

    res.status(200)
    return res.json(result)

  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in util.ts/validateAddressSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    validateAddressSingle,
    validateAddressBulk
  }
}
