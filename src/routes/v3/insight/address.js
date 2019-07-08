/*
  Address route
*/

"use strict"

const express = require("express")
const requestUtils = require("../services/requestUtils")
const axios = require("axios")
const routeUtils = require("../route-utils")
const wlogger = require("../../../util/winston-logging")

//const router = express.Router()
const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

// Use the default (and max) page size of 1000
// https://github.com/bitpay/insight-api#notes-on-upgrading-from-v03
const PAGE_SIZE = 1000

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/details/:address", detailsSingle)
router.post("/details", detailsBulk)
router.post("/utxo", utxoBulk)
router.get("/utxo/:address", utxoSingle)
router.post("/unconfirmed", unconfirmedBulk)
router.get("/unconfirmed/:address", unconfirmedSingle)
router.get("/transactions/:address", transactionsSingle)
router.post("/transactions", transactionsBulk)
router.get("/fromXPub/:xpub", fromXPubSingle)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

// Query the Insight API for details on a single BCH address.
// Returns a Promise.
async function detailsFromInsight(thisAddress, currentPage = 0) {
  try {
    //const addr = bchjs.Address.toLegacyAddress(thisAddress)
    const addr = bchjs.Address.toCashAddress(thisAddress)

    let path = `${process.env.BITCOINCOM_BASEURL}addr/${addr}`

    // Set from and to params based on currentPage and pageSize
    // https://github.com/bitpay/insight-api/blob/master/README.md#notes-on-upgrading-from-v02
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE
    path = `${path}?from=${from}&to=${to}`

    //console.log(`insight path: ${path}`)

    // Query the Insight server.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    // Calculate pagesTotal from response
    const pagesTotal = Math.ceil(retData.txApperances / PAGE_SIZE)

    // Append different address formats to the return data.
    retData.legacyAddress = bchjs.Address.toLegacyAddress(retData.addrStr)
    retData.cashAddress = bchjs.Address.toCashAddress(retData.addrStr)
    delete retData.addrStr

    // Append pagination information to the return data.
    retData.currentPage = currentPage
    retData.pagesTotal = pagesTotal

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// POST handler for bulk queries on address details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"]}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"], "from": 1, "to": 5}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
async function detailsBulk(req, res, next) {
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

    wlogger.debug(`Executing address/details with these addresses: `, addresses)

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
      detailsFromInsight(address, currentPage)
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

    //logger.error(`Error in detailsBulk(): `, err)
    wlogger.error(`Error in address.ts/detailsBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler for single address details
async function detailsSingle(req, res, next) {
  try {
    const address = req.params.address
    const currentPage = req.query.page ? parseInt(req.query.page, 10) : 0

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
      `Executing address/detailsSingle with this address: `,
      address
    )

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

    // Query the Insight API.
    const retData = await detailsFromInsight(address, currentPage)

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
    //logger.error(`Error in address.ts/detailsSingle: `, err)
    wlogger.error(`Error in address.ts/detailsSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve UTXO data from the Insight API
async function utxoFromInsight(thisAddress) {
  try {
    const addr = bchjs.Address.toCashAddress(thisAddress)

    const path = `${process.env.BITCOINCOM_BASEURL}addr/${addr}/utxo`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = {
      utxos: Array,
      legacyAddress: String,
      cashAddress: String,
      scriptPubKey: String
    }
    if (response.data.length && response.data[0].scriptPubKey) {
      const spk = response.data[0].scriptPubKey
      retData.scriptPubKey = spk
    }
    retData.legacyAddress = bchjs.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = bchjs.Address.toCashAddress(thisAddress)
    retData.utxos = response.data.map(utxo => {
      delete utxo.address
      delete utxo.scriptPubKey
      return utxo
    })
    //console.log(`utxoFromInsight retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// Retrieve UTXO information for an address.
async function utxoBulk(req, res, next) {
  try {
    let addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the address array.
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bchjs.Address.toLegacyAddress(thisAddress)
      } catch (er) {
        //if (er.message.includes("Unsupported address format"))
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

    wlogger.debug(
      `Executing address/utxoBulk with these addresses: `,
      addresses
    )

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    addresses = addresses.map(async (address, index) =>
      utxoFromInsight(address)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(addresses)

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/utxoBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler for single address details
async function utxoSingle(req, res, next) {
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

    wlogger.debug(`Executing address/utxoSingle with this address: `, address)

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

    // Query the Insight API.
    const retData = await utxoFromInsight(address)

    // Return the array of retrieved address information.
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
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/utxoSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve any unconfirmed TX information for a given address.
async function unconfirmedBulk(req, res, next) {
  try {
    const addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    wlogger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

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

    // Collect an array of promises.
    const promises = addresses.map(address => utxoFromInsight(address))

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(promises)

    // Loop through each result
    const finalResult = result.map(elem => {
      //console.log(`elem: ${util.inspect(elem)}`)

      // Filter out confirmed transactions.
      const unconfirmedUtxos = elem.utxos.filter(
        utxo => utxo.confirmations === 0
      )

      elem.utxos = unconfirmedUtxos

      return elem
    })

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(finalResult)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/unconfirmedBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function unconfirmedSingle(req, res, next) {
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

    wlogger.debug(`Executing address/utxoSingle with this address: `, address)

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

    // Query the Insight API.
    const retData = await utxoFromInsight(address)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Loop through each returned UTXO.
    const unconfirmedUTXOs = []
    for (let j = 0; j < retData.utxos.length; j++) {
      const thisUtxo = retData.utxos[j]

      // Only interested in UTXOs with no confirmations.
      if (thisUtxo.confirmations === 0) unconfirmedUTXOs.push(thisUtxo)
    }

    retData.utxos = unconfirmedUTXOs

    // Return the array of retrieved address information.
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
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/unconfirmedSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve transaction data from the Insight API
async function transactionsFromInsight(thisAddress, currentPage = 0) {
  try {
    const path = `${process.env.BITCOINCOM_BASEURL}txs/?address=${thisAddress}&pageNum=${currentPage}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = response.data
    retData.legacyAddress = bchjs.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = bchjs.Address.toCashAddress(thisAddress)
    retData.currentPage = currentPage

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// Get an array of TX information for a given address.
async function transactionsBulk(req, res, next) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    wlogger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

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

    // Loop through each address and collect an array of promises.
    addresses = addresses.map(async (address, index) =>
      transactionsFromInsight(address, currentPage)
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/transactionsBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function transactionsSingle(req, res, next) {
  try {
    const address = req.params.address
    const currentPage = req.query.page ? parseInt(req.query.page, 10) : 0

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
      `Executing address/transactionsSingle with this address: `,
      address
    )

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

    // Query the Insight API.
    const retData = await transactionsFromInsight(address, currentPage)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Return the array of retrieved address information.
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
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/transactionsSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function fromXPubSingle(req, res, next) {
  try {
    const xpub = req.params.xpub
    const hdPath = req.query.hdPath ? req.query.hdPath : "0"

    if (!xpub || xpub === "") {
      res.status(400)
      return res.json({ error: "xpub can not be empty" })
    }

    // Reject if xpub is an array.
    if (Array.isArray(xpub)) {
      res.status(400)
      return res.json({
        error: "xpub can not be an array. Use POST for bulk upload."
      })
    }

    wlogger.debug(`Executing address/fromXPub with this xpub: `, xpub)

    const cashAddr = bchjs.Address.fromXPub(xpub, hdPath)
    const legacyAddr = bchjs.Address.toLegacyAddress(cashAddr)
    res.status(200)
    return res.json({
      cashAddress: cashAddr,
      legacyAddress: legacyAddr
    })
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/fromXPubSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    detailsBulk,
    detailsSingle,
    utxoBulk,
    utxoSingle,
    unconfirmedBulk,
    unconfirmedSingle,
    transactionsBulk,
    transactionsSingle,
    fromXPubSingle
  }
}
