"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")

const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")
const blockbook = require("./blockbook")

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

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

let _this

class UtilRoute {
  constructor() {
    this.bchjs = bchjs
    this.blockbook = blockbook

    _this = this
  }

  root(req, res, next) {
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
  async validateAddressSingle(req, res, next) {
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
  async validateAddressBulk(req, res, next) {
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

  async sweepWif(req, res, next) {
    try {
      // Validate input
      const wif = req.body.wif
      const toAddr = req.body.toAddr

      if (typeof wif !== "string" || wif.length !== 52) {
        res.status(400)
        return res.json({
          error: "WIF needs to a proper compressed WIF starting with K or L"
        })
      }

      if (!toAddr || toAddr === "") {
        res.status(400)
        return res.json({ error: "address can not be empty" })
      }

      wlogger.debug(`Executing util/sweepWif with this address: `, toAddr)

      // Generate a private and public key pair from the WIF.
      const ecPair = bchjs.ECPair.fromWIF(wif)
      const fromAddr = bchjs.ECPair.toCashAddress(ecPair)

      // Get a balance on the public address
      const balances = await _this.blockbook.testableComponents.balanceFromBlockbook(
        fromAddr
      )
      console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      // Total balance is the sum of the confirmed and unconfirmed balance.
      const totalBalance =
        Number(balances.balance) + Number(balances.unconfirmedBalance)

      // Exit if balance is zero.
      if (isNaN(totalBalance) || totalBalance === 0) {
        res.status(422)
        return res.json({ error: "No balance found at BCH address." })
      }

      // Get all UTXOs help by the address.
      const utxos = await _this.blockbook.testableComponents.utxosFromBlockbook(
        fromAddr
      )

      const tokenUtxos = []
      const bchUtxos = []

      // Exit if there are no UTXOs.
      if (utxos.length === 0) return { bchUtxos, tokenUtxos }

      // Figure out which UTXOs are associated with SLP tokens.
      const isTokenUtxo = await _this.bchjs.SLP.Utils.tokenUtxoDetails(utxos)
      console.log(`isTokenUtxo: ${JSON.stringify(isTokenUtxo, null, 2)}`)

      // Separate the bch and token UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        // Filter based on isTokenUtxo.
        if (!isTokenUtxo[i]) bchUtxos.push(utxos[i])
        else tokenUtxos.push(isTokenUtxo[i])
      }

      // Throw error if no BCH to move tokens.
      if (bchUtxos.length === 0 && tokenUtxos.length > 0) {
        res.status(422)
        return res.json({
          error: `Tokens found, but no BCH UTXOs found. Add BCH to wallet to move tokens.`
        })
      }

      // Choose the sweeping algorithm based if there are tokens or not.
      // if (tokenUtxos.length === 0) hex = await _this._sweepBCH(flags)
      // else hex = await _this._sweepTokens(flags, bchUtxos, tokenUtxos)

      // Throw error if there is more than one token class.

      // Generate a transaction to move tokens and BCH.

      // Broadcast the transaction.

      res.status(200)
      return res.json(true)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      wlogger.error(`Error in util.js/sweepWif().`, err)

      res.status(500)
      return res.json({ error: util.inspect(err) })
    }
  }

  // Sweep BCH only from a private WIF.
  async _sweepBCH(options) {
    try {
      if (options.testnet)
        this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })

      const wif = flags.wif
      const toAddr = flags.address

      const ecPair = this.BITBOX.ECPair.fromWIF(wif)

      const fromAddr = this.BITBOX.ECPair.toCashAddress(ecPair)

      // Get the UTXOs for that address.
      let utxos = await this.BITBOX.Blockbook.utxo(fromAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Ensure all utxos have the satoshis property.
      utxos = utxos.map(x => {
        x.satoshis = Number(x.value)
        return x
      })
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // instance of transaction builder
      let transactionBuilder
      if (flags.testnet)
        transactionBuilder = new this.BITBOX.TransactionBuilder("testnet")
      else transactionBuilder = new this.BITBOX.TransactionBuilder()

      let originalAmount = 0

      // Loop through all UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        originalAmount = originalAmount + utxo.satoshis

        transactionBuilder.addInput(utxo.txid, utxo.vout)
      }

      if (originalAmount < 546) {
        throw new Error(
          `Original amount less than the dust limit. Not enough BCH to send.`
        )
      }

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.BITBOX.BitcoinCash.getByteCount(
        { P2PKH: utxos.length },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.BITBOX.Address.toLegacyAddress(toAddr),
        sendAmount
      )

      // Loop through each input and sign
      let redeemScript
      for (var i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        transactionBuilder.sign(
          i,
          ecPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      return hex
    } catch (err) {
      wlogger.error(`Error in util.js/sweepBCH().`)
      throw err
    }
  }

  // Sweep BCH and tokens from a WIF.
  async _sweepTokens(options) {
    try {
    } catch (err) {
      wlogger.error(`Error in util.js/sweepBCH().`)
      throw err
    }
  }
}

const utilRoute = new UtilRoute()

router.get("/", utilRoute.root)
router.get("/validateAddress/:address", utilRoute.validateAddressSingle)
router.post("/validateAddress", utilRoute.validateAddressBulk)
router.post("/sweep", utilRoute.sweepWif)

module.exports = {
  router,
  // testableComponents: {
  //   root,
  //   validateAddressSingle,
  //   validateAddressBulk,
  //   sweepWif
  // }
  UtilRoute
}
