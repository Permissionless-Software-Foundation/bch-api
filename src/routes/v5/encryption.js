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

const BCHJS = require('@psf/bch-js')
const restURL = process.env.LOCAL_RESTURL
  ? process.env.LOCAL_RESTURL
  : 'https://api.fullstack.cash/v5/'
const bchjs = new BCHJS({ restURL })

let _this

class Encryption {
  constructor () {
    _this = this

    _this.config = config
    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    // _this.blockbook = blockbook
    // _this.rawTransactions = rawTransactions

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
      return res.json({ success: false, error: msg })
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
   * @apiDescription Searches the blockchain for a public key associated with a
   * BCH address. Returns an object. If successful, the publicKey property will
   * contain a hexidecimal representation of the public key.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/encryption/publickey/bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf" -H "accept: application/json"
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

      // Generate a user object that can be passed along with internal calls
      // from bch-js.
      const usrObj = {
        ip: req._remoteAddress,
        jwtToken: req.locals.jwtToken,
        proLimit: req.locals.proLimit,
        apiLevel: req.locals.apiLevel
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

      // console.log(
      wlogger.debug(
        'Executing encryption/getPublicKey with this address: ',
        cashAddr
      )

      const rawTxData = await _this.bchjs.Electrumx.transactions([cashAddr], usrObj)
      // console.log(`rawTxData: ${JSON.stringify(rawTxData, null, 2)}`)

      // Extract just the TXIDs
      const txids = rawTxData.transactions[0].transactions.map((elem) => elem.tx_hash)
      // console.log(`txids: ${JSON.stringify(txids, null, 2)}`)

      // throw error if there is no transaction history.
      if (!txids || txids.length === 0) {
        throw new Error('No transaction history.')
      }

      // Loop through the transaction history and search for the public key.
      for (let i = 0; i < txids.length; i++) {
        const thisTx = txids[i]

        const txDetails = await _this.bchjs.RawTransactions.getRawTransaction(
          [thisTx],
          true,
          usrObj
        )
        // console.log(`txDetails: ${JSON.stringify(txDetails, null, 2)}`)

        const vin = txDetails[0].vin

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
      // console.log('Error in encryption.js/getPublicKey().', err)
      wlogger.error('Error in encryption.js/getPublicKey().', err)

      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Encryption
