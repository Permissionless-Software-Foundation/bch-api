"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")

const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const bchjsHTTP = axios.create({
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
router.get("/validateAddress/:address", validateAddressSingle)
router.post("/validateAddress", validateAddressBulk)

function root(req, res, next) {
  return res.json({ status: "util" })
}
/**
 * @api {get} /util/validateAddress/{address}  Get information about single bitcoin cash address.
 * @apiName Information about single bitcoin cash address
 * @apiGroup Util
 * @apiDescription Returns information about single bitcoin cash address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "http://localhost:3000/v3/util/validateAddress/bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c" -H "accept: application/json"
 *
 *
 */
async function validateAddressSingle(req, res, next) {
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
/**
 * @api {post} /util/validateAddress  Get information about bulk bitcoin cash addresses..
 * @apiName Information about bulk bitcoin cash addresses.
 * @apiGroup Util
 * @apiDescription Returns information about bulk bitcoin cash addresses..
 *
 *
 * @apiExample Example usage:
 * curl -X POST "http://localhost:3000/v3/util/validateAddress" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c","bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"]}'
 * curl -X POST "http://localhost:3000/v3/util/validateAddress" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c","bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"],"from": 1, "to": 5}'
 *
 *
 */
async function validateAddressBulk(req, res, next) {
  try {
    const addresses = req.body.addresses

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
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        var legacyAddr = bchjs.Address.toLegacyAddress(address)
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

    wlogger.debug(`Executing util/validate with these addresses: `, addresses)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    // Loop through each address and creates an array of requests to call in parallel
    const promises = addresses.map(async address => {
      requestConfig.data.id = "validateaddress"
      requestConfig.data.method = "validateaddress"
      requestConfig.data.params = [address]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel Insight requests to return.
    const axiosResult = await axios.all(promises)

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
