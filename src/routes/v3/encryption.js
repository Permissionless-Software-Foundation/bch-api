/*
  Encryption API route
*/

'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')

const wlogger = require('../../util/winston-logging')
const config = require('../../../config')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

// Use Blockbook for getting indexer data.
const Blockbook = require('./blockbook')
const blockbook = new Blockbook()

// Use RawTransactions library for getting raw blockchain data.
const RawTransactions = require('./full-node/rawtransactions')
const rawTransactions = new RawTransactions()

let _this

class Encryption {
  constructor () {
    _this = this

    _this.config = config
    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    _this.blockbook = blockbook
    _this.rawTransactions = rawTransactions

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/publickey/:address', _this.getPublicKey)
  }

  // DRY error handler.
  errorHandler (err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Handle error patterns specific to this route.
    if (err.message) {
      res.status(400)
      return res.json({ success: false, error: err.message })
    }

    wlogger.error('Unhandled error in Encryption library: ', err)

    // If error can be handled, return the stack trace
    res.status(500)
    return res.json({ error: util.inspect(err) })
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'encryption' })
  }

  /**
   * @api {get} /encryption/publickey/{addr} Get public key for a BCH address.
   * @apiName Get encryption key for bch address
   * @apiGroup Encryption
   * @apiDescription Searches the blockchain for a public key associated with a BCH address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/encryption/publickey/bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf" -H "accept: application/json"
   *
   */
  async getPublicKey (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array.'
        })
      }

      const cashAddr = _this.bchjs.Address.toCashAddress(address)

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      wlogger.debug(
        'Executing encryption/getPublicKey with this address: ',
        cashAddr
      )

      // Retrieve the transaction history for this address.
      const balance = await _this.blockbook.balanceFromBlockbook(cashAddr)
      // console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      const txHistory = balance.txids
      // console.log(`txHistory: ${JSON.stringify(txHistory, null, 2)}`)

      if (txHistory.length === 0) {
        throw new Error('No transaction history.')
      }

      // Loop through the transaction history and search for the public key.
      for (let i = 0; i < txHistory.length; i++) {
        const thisTx = txHistory[i]

        const txDetails = await _this.rawTransactions.getRawTransactionsFromNode(
          thisTx,
          true
        )
        // console.log(`txDetails: ${JSON.stringify(txDetails, null, 2)}`)

        const vin = txDetails.vin

        // Loop through each input.
        for (let j = 0; j < vin.length; j++) {
          const thisVin = vin[j]
          // console.log(`thisVin: ${JSON.stringify(thisVin, null, 2)}`)

          // Extract the script signature.
          const scriptSig = thisVin.scriptSig.asm.split(' ')
          // console.log(`scriptSig: ${JSON.stringify(scriptSig, null, 2)}`)

          // Extract the public key from the script signature.
          const pubKey = scriptSig[scriptSig.length - 1]
          // console.log(`pubKey: ${pubKey}`)

          // Generate cash address from public key.
          const keyBuf = Buffer.from(pubKey, 'hex')
          const ec = _this.bchjs.ECPair.fromPublicKey(keyBuf)
          const cashAddr2 = _this.bchjs.ECPair.toCashAddress(ec)
          // console.log(`cashAddr2: ${cashAddr2}`)

          // If public keys match, this is the correct public key.
          if (cashAddr === cashAddr2) {
            res.status(200)
            return res.json({
              success: true,
              publicKey: pubKey
            })
          }
        }
      }

      res.status(200)
      return res.json({
        success: false,
        publicKey: 'not found'
      })
    } catch (err) {
      wlogger.error('Error in encryption.js/getPublicKey().', err)

      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Encryption
