/*
  Electrum API route
*/

'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')
const bitcore = require('bitcore-lib-cash')
const ElectrumCash = require('electrum-cash').Client

const wlogger = require('../../util/winston-logging')
const config = require('../../../config')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class Electrum {
  constructor () {
    _this = this

    _this.config = config
    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    _this.bitcore = bitcore

    // Configure the ElectrumX/Fulcrum server.
    // _this.electrumx = new ElectrumCash(
    //   config.electrumx.application,
    //   config.electrumx.version,
    //   config.electrumx.confidence,
    //   config.electrumx.distribution,
    //   ElectrumCash.ORDER.PRIORITY
    // )
    _this.electrumx = new ElectrumCash(
      config.electrumx.electrum.application,
      config.electrumx.electrum.version,
      config.electrumx.electrum.serverUrl,
      config.electrumx.electrum.serverPort
    )

    _this.isReady = false
    // _this.connectToServers()

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/utxos/:address', _this.getUtxos)
  }

  // Initializes a connection to electrum servers.
  async connect () {
    try {
      console.log('Entering connectToServers()')

      // Return immediately if a connection has already been established.
      if (_this.isReady) return true

      // Connect to the server.
      await _this.electrumx.connect()

      // Set the connection flag.
      _this.isReady = true

      // console.log(`_this.isReady: ${_this.isReady}`)
      return _this.isReady
    } catch (err) {
      // console.log(`err: `, err)
      wlogger.error('Error in electrumx.js/connect()')
      throw err
    }
  }

  // Disconnect from the ElectrumX server.
  async disconnect () {
    try {
      // Return immediately if the isReady flag is false.
      if (!_this.isReady) return true

      // Disconnect from the server.
      await _this.electrumx.disconnect()

      // Clear the isReady flag.
      _this.isReady = false

      // Return true to signal that the disconnection happened successfully.
      return true
    } catch (err) {
      // console.log(`err: `, err)
      wlogger.error('Error in electrumx.js/disconnect()')
      throw err
    }
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

    // If error can be handled, return the stack trace
    res.status(500)
    return res.json({ error: util.inspect(err) })
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'electrumx' })
  }

  async getUtxos (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array. Use POST for bulk upload.'
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

      wlogger.debug('Executing electrumx/getUtxos with this address: ', address)

      // Convert the address to a scripthash.
      const scripthash = _this.addressToScripthash(cashAddr)

      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the utxos from the ElectrumX server.
      var electrumResponse = await _this.electrumx.request(
        'blockchain.scripthash.listunspent',
        scripthash
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      // Pass the error message if ElectrumX reports an error.
      if (Object.prototype.hasOwnProperty.call(electrumResponse, 'code')) {
        res.status(400)
        return res.json({
          success: false,
          message: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        utxos: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getUtxos().', err)

      return _this.errorHandler(err, res)
    }
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
