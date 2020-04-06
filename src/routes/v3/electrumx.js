/*
  Electrum API route
*/

'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')
const bitcore = require('bitcore-lib-cash')

const wlogger = require('../../util/winston-logging')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class Electrum {
  constructor () {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    _this.bitcore = bitcore

    _this.router = router
    _this.router.get('/', _this.root)
    // _this.router.get('/balance/:address', _this.balanceSingle)
    // _this.router.post('/balance', _this.balanceBulk)
    // _this.router.get('/utxos/:address', _this.utxosSingle)
    // _this.router.post('/utxos', _this.utxosBulk)
    // _this.router.get('/tx/:txid', _this.txSingle)
    // _this.router.post('/tx', _this.txBulk)
  }

  // DRY error handler.
  errorHandler (err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'electrumx' })
  }

  // Query the Blockbook Node API for a balance on a single BCH address.
  // Returns a Promise.
  async balanceFromBlockbook (thisAddress) {
    try {
      // console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

      // Convert the address to a cashaddr without a prefix.
      const addr = _this.bchjs.Address.toCashAddress(thisAddress)

      const path = `${_this.BLOCKBOOKPATH.addrPath}${addr}`
      // console.log(`path: ${path}`)

      // Query the Blockbook Node API.
      const options = {
        method: 'get',
        baseURL: path
      }

      const axiosResponse = await _this.axios.request(options)
      const retData = axiosResponse.data
      // console.log(`retData: ${util.inspect(retData)}`)

      return retData
    } catch (err) {
      // Dev Note: Do not log error messages here. Throw them instead and let the
      // parent function handle it.
      wlogger.debug('Error in blockbook.js/balanceFromBlockbook()')
      throw err
    }
  }

  /**
   * @api {get} /electrumx/balance/{addr} Get balance for a single address.
   * @apiName Balance for a single address
   * @apiGroup Blockbook
   * @apiDescription Returns an object with balance and details about an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/blockbook/balance/bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async balanceSingle (req, res, next) {
    try {
      const address = req.params.address

      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      wlogger.debug(
        'Executing blockbook/balanceSingle with this address: ',
        address
      )

      // Ensure the input is a valid BCH address.
      try {
        // const legacyAddr = bchjs.Address.toLegacyAddress(address)
        _this.bchjs.Address.toLegacyAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      // Query the Blockbook Node API.
      const retData = await _this.balanceFromBlockbook(address)

      // Return the retrieved address information.
      res.status(200)
      return res.json(retData)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockbook.js/balanceSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  async getUtxos (req, res, next) {
    try {
      let scripthash = '' // Default value

      scripthash = _this.addressToScripthash(req.params.address)

      res.status(200)
      return res.json(scripthash)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getUtxos().', err)

      return _this.errorHandler(err, res)
    }

    // try {
    //   var electrumResponse = await electrum.request(
    //     'blockchain.scripthash.listunspent',
    //     scripthash
    //   )
    // } catch (e) {
    //   return res.status(500).send({
    //     success: false,
    //     message: e.message
    //   })
    // }
    //
    // if (electrumResponse.hasOwnProperty('code')) {
    //   return res.status(400).send({
    //     success: false,
    //     message: electrumResponse.message
    //   })
    // }
    //
    // return res.send({
    //   success: true,
    //   utxos: electrumResponse
    // })
  }

  // Convert a 'bitcoincash:...' address to a script hash used by ElectrumX.
  addressToScripthash (addrStr) {
    try {
      // console.log(`addrStr: ${addrStr}`)

      const address = _this.bitcore.Address.fromString(addrStr)
      // console.log(`address: ${address}`)

      const script = _this.bitcore.Script.buildPublicKeyHashOut(address)
      // console.log(`script: ${script}`)

      const scripthash = _this.bitcore.crypto.Hash.sha256(script.toBuffer())
        .reverse()
        .toString('hex')
      // console.log(`scripthash: ${scripthash}`)

      return scripthash
    } catch (err) {
      wlogger.error('Error in electrumx.js/addressToScripthash()')
      throw err
    }
  }
}

module.exports = Electrum
