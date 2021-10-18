/*
  Electrum API route
*/

'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')
// const bitcore = require('bitcore-lib-cash')

// const ElectrumCash = require('electrum-cash').ElectrumClient
// const ElectrumCash = require('/home/trout/work/personal/electrum-cash/electrum.js').Client // eslint-disable-line

const wlogger = require('../../../util/winston-logging')
const config = require('../../../../config')

const RouteUtils = require('../../../util/route-utils')
const routeUtils = new RouteUtils()

// const BCHJS = require("@psf/bch-js");
// const bchjs = new BCHJS();

let _this

class BcashSlp {
  constructor () {
    this.config = config
    this.axios = axios
    this.routeUtils = routeUtils
    // this.bchjs = bchjs;
    // _this.bitcore = bitcore

    this.bcashServer = process.env.BCASH_SERVER
    if (!this.bcashServer) {
      // console.warn('FULCRUM_API env var not set. Can not connect to Fulcrum indexer.')
      throw new Error(
        'BCASH_SERVER env var not set. Can not connect to bcash full node.'
      )
    }

    this.router = router
    this.router.get('/', this.root)
    this.router.get('/utxos/:address', this.getUtxos)
  }

  /**
   * @api {get} /bcash/utxos/{addr} Get utxos for a single address.
   * @apiName UTXOs for a single address
   * @apiGroup bcash
   * @apiDescription Returns an object with UTXOs associated with an address.
   * This UTXOs will be hydrated with token information.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/bcash/utxos/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
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

      // TODO: Customize this function below here for bcash, based on this gist:
      // https://gist.github.com/christroutner/dcb25a895900e557d7b43341ee85fa79

      wlogger.debug(
        'Executing electrumx/getUtxos with this address: ',
        cashAddr
      )

      // Get data from ElectrumX server.
      const response = await _this.axios.get(
        `${_this.fulcrumApi}electrumx/utxos/${address}`
      )
      // console.log('response', response, _this.fulcrumApi)

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getUtxos().', err)

      return _this.errorHandler(err, res)
    }
  }

  // DRY error handler.
  errorHandler (err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    // console.log('errorHandler msg: ', msg)
    // console.log('errorHandler status: ', status)

    if (msg) {
      res.status(status)
      return res.json({ success: false, error: msg })
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
    return res.json({ status: 'bcash-slp' })
  }
}

module.exports = BcashSlp
