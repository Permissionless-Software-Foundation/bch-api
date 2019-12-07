/*
  Bitcore Node API route
*/

"use strict"

const express = require("express")
const axios = require("axios")
const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

//const BITCORE_URL = process.env.BITCORE_URL

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/balance/:address", balanceSingle)
router.post("/balance", balanceBulk)
router.get("/utxos/:address", utxosSingle)
router.post("/utxos", utxosBulk)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

// Query the Bitcore Node API for a balance on a single BCH address.
// Returns a Promise.
async function balanceFromBitcore(thisAddress) {
  try {
    //console.log(`BITCORE_URL: ${BITCORE_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = bchjs.Address.toCashAddress(thisAddress, false)

    // Determine if we are working with the testnet or mainnet networks.
    let network = "mainnet"
    if (process.env.NETWORK === "testnet") network = "testnet"

    const path = `${process.env.BITCORE_URL}api/BCH/${network}/address/${addr}/balance`

    //console.log(`path: ${path}`)

    // Query the Bitcore Node API.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

/**
 * @api {get} /bitcore/balance/:address Get BCH balance for an address
 * @apiName GetBalance
 * @apiGroup Bitcore
 *
 * @apiParam {String} address Bitcoin Cash address.
 *
 * @apiSuccess {String} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 */
// GET handler for single balance
async function balanceSingle(req, res, next) {
  try {
    const address = req.params.address

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    wlogger.debug(
      `Executing bitcore/balanceSingle with this address: `,
      address
    )

    // Ensure the input is a valid BCH address.
    try {
      const legacyAddr = bchjs.Address.toLegacyAddress(address)
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

    // Query the Bitcore Node API.
    const retData = await balanceFromBitcore(address)

    // Return the retrieved address information.
    res.status(200)
    return res.json(retData)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    wlogger.error(`Error in bitcore.js/balanceSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// POST handler for bulk queries on address details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"]}' -H "Content-Type: application/json" https://mainnet.bchjs.cash/v2/address/details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"], "from": 1, "to": 5}' -H "Content-Type: application/json" https://mainnet.bchjs.cash/v2/address/details
async function balanceBulk(req, res, next) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

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

    wlogger.debug(
      `Executing bitcore.js/balanceBulk with these addresses: `,
      addresses
    )

    // Validate each element in the address array.
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bchjs.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    addresses = addresses.map(async (address, index) =>
      balanceFromBitcore(address)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(addresses)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in bitcore.js/balanceBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Query the Bitcore Node API for utxos associated with a BCH address.
// Returns a Promise.
async function utxosFromBitcore(thisAddress) {
  try {
    //console.log(`BITCORE_URL: ${BITCORE_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = bchjs.Address.toCashAddress(thisAddress, false)

    // Determine if we are working with the testnet or mainnet networks.
    let network = "mainnet"
    if (process.env.NETWORK === "testnet") network = "testnet"

    const path = `${process.env.BITCORE_URL}api/BCH/${network}/address/${addr}/?unspent=true`

    // Query the Bitcore Node API.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// GET handler for single balance
async function utxosSingle(req, res, next) {
  try {
    const address = req.params.address

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    wlogger.debug(`Executing bitcore/utxoSingle with this address: `, address)

    // Ensure the input is a valid BCH address.
    try {
      const legacyAddr = bchjs.Address.toLegacyAddress(address)
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

    // Query the Bitcore Node API.
    const retData = await utxosFromBitcore(address)

    // Return the retrieved address information.
    res.status(200)
    return res.json(retData)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    wlogger.error(`Error in bitcore.js/utxosSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// POST handler for bulk queries on address utxos
async function utxosBulk(req, res, next) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

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

    wlogger.debug(
      `Executing bitcore.js/utxosBulk with these addresses: `,
      addresses
    )

    // Validate each element in the address array.
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bchjs.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    addresses = addresses.map(async (address, index) =>
      utxosFromBitcore(address)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(addresses)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in bitcore.js/utxosBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    balanceSingle,
    balanceBulk,
    utxosSingle,
    utxosBulk
  }
}
