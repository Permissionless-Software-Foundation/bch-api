/*
  Routes for interacting with the psf-slp-indexer
*/

// Public npm libraries
const express = require('express')
const router = express.Router()
const axios = require('axios')
const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

// Local libraries
// const wlogger = require('../../../util/winston-logging')
// const config = require('../../../../config')
let _this
class PsfSlpIndexer {
  constructor () {
    // Encapsulate dependencies
    _this = this
    _this.axios = axios
    _this.router = router
    _this.routeUtils = routeUtils
    _this.psfSlpIndexerApi = process.env.SLP_INDEXER_API
    if (!this.psfSlpIndexerApi) {
      // console.warn('FULCRUM_API env var not set. Can not connect to Fulcrum indexer.')
      throw new Error(
        'SLP_INDEXER_API env var not set. Can not connect to psf slp indexer.'
      )
    }

    // Define routes
    _this.router.get('/', this.root)
    // this.router.get('/status', this.getStatus)
    // this.router.post('/address', this.getAddress)
    // this.router.post('/txid', this.getTxid)
    _this.router.post('/token', this.getTokenStats)
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
    return res.json({ status: 'psf-slp-indexer' })
  }
}

module.exports = PsfSlpIndexer
