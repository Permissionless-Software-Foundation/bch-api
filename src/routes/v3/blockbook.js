/*
  Blockbook API route
*/

"use strict"

const express = require("express")
const axios = require("axios")
const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

// Library for easily switching the API paths to use different instances of
// Blockbook.
const BlockbookPath = require("../../util/blockbook-path")
const BLOCKBOOKPATH = new BlockbookPath()
// BLOCKBOOKPATH.toOpenBazaar()

const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

//const BLOCKBOOK_URL = process.env.BLOCKBOOK_URL

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/balance/:address", balanceSingle)
router.post("/balance", balanceBulk)
router.get("/utxos/:address", utxosSingle)
router.post("/utxos", utxosBulk)
router.get("/tx/:txid", txSingle)
router.post("/tx", txBulk)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

// Query the Blockbook Node API for a balance on a single BCH address.
// Returns a Promise.
async function balanceFromBlockbook(thisAddress) {
  try {
    //console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = bchjs.Address.toCashAddress(thisAddress)

    const path = `${BLOCKBOOKPATH.addrPath}${addr}`
    // console.log(`path: ${path}`)

    // Query the Blockbook Node API.
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
 * @api {get} /blockbook/balance/{addr} Get balance for a single address.
 * @apiName Balance for a single address
 * @apiGroup Blockbook
 * @apiDescription Returns an object with balance and details about an address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/blockbook/balance/bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf" -H "accept: application/json"
 *
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
      `Executing blockbook/balanceSingle with this address: `,
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

    // Query the Blockbook Node API.
    const retData = await balanceFromBlockbook(address)

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
    wlogger.error(`Error in blockbook.js/balanceSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {post} /blockbook/balance Get balance for an array of addresses.
 * @apiName  Balance for an array of addresses
 * @apiGroup Blockbook
 * @apiDescription Return balances and details for an array of addresses.
 * Limited to 20 items per request.
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/blockbook/balance" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
 *
 *
 */
// POST handler for bulk queries on address details
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
      `Executing blockbook.js/balanceBulk with these addresses: `,
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
      //console.log(`address: ${address}`)
      balanceFromBlockbook(address)
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

    wlogger.error(`Error in blockbook.js/balanceBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Query the Blockbook API for utxos associated with a BCH address.
// Returns a Promise.
async function utxosFromBlockbook(thisAddress) {
  try {
    //console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = bchjs.Address.toCashAddress(thisAddress)

    const path = `${BLOCKBOOKPATH.utxoPath}${addr}`
    // console.log(`path: ${path}`)

    // Query the Blockbook API.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    // console.log(`retData: ${util.inspect(retData)}`)

    // Add the satoshis property to each UTXO.
    for (let i = 0; i < retData.length; i++)
      retData[i].satoshis = Number(retData[i].value)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

/**
 * @api {get} /blockbook/utxos/{addr} Get utxos for a single address.
 * @apiName UTXOs for a single address
 * @apiGroup Blockbook
 * @apiDescription Returns an object with UTXOs associated with an address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/blockbook/utxos/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
 *
 */
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

    wlogger.debug(
      `Executing blockbook/utxosSingle with this address: `,
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

    // Query the Blockbook API.
    const retData = await utxosFromBlockbook(address)

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
    wlogger.error(`Error in blockbook.js/utxosSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {post} /blockbook/utxos Get UTXOs for an array of addresses.
 * @apiName  UTXOs for an array of addresses
 * @apiGroup Blockbook
 * @apiDescription Return UTXOs associate with an array of addresses.
 * Limited to 20 items per request.
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/blockbook/utxos" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3","bitcoincash:qzy8wnj0dz927eu6kvh8v2pqsr5w8jh33ys757tdtq"]}'
 *
 *
 */
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
      `Executing blockbook.js/utxosBulk with these addresses: `,
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
      //console.log(`address: ${address}`)
      utxosFromBlockbook(address)
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

    wlogger.error(`Error in blockbook.js/utxosBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Query the Blockbook Node API for transactions on a single TXID.
// Returns a Promise.
async function transactionsFromBlockbook(txid) {
  try {
    //console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

    const path = `${BLOCKBOOKPATH.txPath}${txid}`
    // console.log(`path: ${path}`)

    // Query the Blockbook Node API.
    const axiosResponse = await axios.get(path)
    const retPromise = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    return retPromise
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

/**
 * @api {get} /blockbook/tx/{txid} Get details for a single transaction.
 * @apiName Details for a single transaction
 * @apiGroup Blockbook
 * @apiDescription Returns an object with details for a single transaction
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/blockbook/tx/6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d" -H "accept: application/json"
 *
 */
// GET handler for single transaction details.
async function txSingle(req, res, next) {
  try {
    const txid = req.params.txid

    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(txid)) {
      res.status(400)
      return res.json({
        error: "txid can not be an array. Use POST for bulk upload."
      })
    }

    // TODO: Add regex comparison of txid to ensure it's valid.
    if (txid.length !== 64) {
      res.status(400)
      return res.json({
        error: `txid must be of length 64 (not ${txid.length})`
      })
    }

    wlogger.debug(`Executing blockbook/txSingle with this txid: `, txid)

    // Query the Blockbook Node API.
    const retData = await transactionsFromBlockbook(txid)

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
    wlogger.error(`Error in blockbook.js/txSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {post} /blockbook/tx Get details for an array of transactions.
 * @apiName  Details for an array of transactions
 * @apiGroup Blockbook
 * @apiDescription Return details for an array of transactions.
 * Limited to 20 items per request.
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/blockbook/tx" -H "accept: application/json" -H "Content-Type: application/json" -d '{"txids":["6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d","6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d"]}'
 *
 *
 */
// POST handler for bulk queries on tx details
async function txBulk(req, res, next) {
  try {
    let txids = req.body.txids
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if txids is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({
        error: "txids need to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(`Executing blockbook.js/txBulk with these txids: `, txids)

    // Validate each element in the txids array.
    for (let i = 0; i < txids.length; i++) {
      const thisTxid = txids[i]

      if (!thisTxid || thisTxid === "") {
        res.status(400)
        return res.json({ error: "txid can not be empty" })
      }

      // TODO: Add regex comparison of txid to ensure it's valid.
      if (thisTxid.length !== 64) {
        res.status(400)
        return res.json({
          error: `txid must be of length 64 (not ${thisTxid.length})`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    txids = txids.map(async (txid, index) =>
      //console.log(`address: ${address}`)
      transactionsFromBlockbook(txid)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(txids)

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

    wlogger.error(`Error in blockbook.js/txBulk().`, err)

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
    utxosBulk,
    txSingle,
    txBulk,
    balanceFromBlockbook,
    utxosFromBlockbook
  }
}
