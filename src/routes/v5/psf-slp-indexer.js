/*
  Routes for interacting with the psf-slp-indexer
*/

// Public npm libraries
const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')

// Local libraries
const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

// Local libraries
// const wlogger = require('../../../util/winston-logging')
const config = require('../../../config')

let _this

class PsfSlpIndexer {
  constructor () {
    // Encapsulate dependencies
    this.axios = axios
    this.router = router
    this.routeUtils = routeUtils
    this.config = config
    this.bchjs = bchjs
    // Define routes
    this.router.get('/', this.root)
    this.router.get('/status', this.getStatus)
    this.router.post('/address', this.getAddress)
    this.router.post('/txid', this.getTxid)
    this.router.post('/token', this.getTokenStats)

    _this = this
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'psf-slp-indexer' })
  }

  /**
   * @api {get} /psf/slp/status/  Indexer Status.
   * @apiName SLP indexer status.
   * @apiGroup PSF SLP
   * @apiDescription Return SLP  indexer status
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:3000/v5/psf/slp/status
   *
   *
   */
  async getStatus (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const response = await _this.axios.get(
        `${_this.psfSlpIndexerApi}slp/status/`
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/address/  SLP  balance for address.
   * @apiName SLP  balance for address.
   * @apiGroup PSF SLP
   * @apiDescription Return SLP  balance for address
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "address": "bitcoincash:qzmd5vxgh9m22m6fgvm57yd6kjnjl9qnwywsf3583n" }' localhost:3000/v5/psf/slp/address
   *
   *
   */
  async getAddress (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      // Validate the input data.
      const address = req.body.address
      if (!address || address === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be empty'
        })
      }

      // Ensure the input is a valid BCH address.
      try {
        _this.bchjs.SLP.Address.toCashAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          success: false,
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/address/`,
        { address }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      // console.log('err', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/txid/  SLP transaction data.
   * @apiName SLP transaction data.
   * @apiGroup PSF SLP
   * @apiDescription Return slp transaction data.
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "txid": "f3e14cd871402a766e85045dc552f2c1e87857dd3ea1b15efab6334ccef5e315" }' localhost:3000/v5/psf/slp/txid
   *
   *
   */
  async getTxid (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const txid = req.body.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'txid can not be empty'
        })
      }

      if (txid.length !== 64) {
        res.status(400)
        return res.json({
          success: false,
          error: 'This is not a txid'
        })
      }

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/tx/`,
        { txid }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      // console.log('err', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/tokenStats/  List stats for a single slp token.
   * @apiName List stats for a single slp token.
   * @apiGroup PSF SLP
   * @apiDescription Return list stats for a single slp token.
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2" }' localhost:3000/v5/psf/slp/token
   *
   *
   */
  async getTokenStats (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const tokenId = req.body.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'tokenId can not be empty'
        })
      }

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/token/`,
        { tokenId }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      return _this.errorHandler(err, res)
    }
  }

  // Check the the environment variable is set correctly.
  checkEnvVar () {
    _this.psfSlpIndexerApi = process.env.SLP_INDEXER_API
    if (!_this.psfSlpIndexerApi) {
      throw new Error(
        'SLP_INDEXER_API env var not set. Can not connect to PSF SLP indexer.'
      )
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
}

module.exports = PsfSlpIndexer
