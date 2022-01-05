'use strict'

const express = require('express')
const router = express.Router()

const axios = require('axios')
const wlogger = require('../../../util/winston-logging')

const RouteUtils = require('../../../util/route-utils')
const routeUtils = new RouteUtils()

// Used to convert error messages to strings, to safely pass to users.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

let _this
class DSProof {
  constructor () {
    _this = this
    _this.axios = axios
    _this.routeUtils = routeUtils

    _this.router = router
    _this.router.get('/', this.root)
    _this.router.get('/getdsproof/:txid', _this.getDSProof)
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

  root (req, res, next) {
    return res.json({ status: 'dsproof' })
  }

  /**
   * @api {get} /dsproof/getdsproof/:txid  Get Double-Spend Proof.
   * @apiName DS Proof.
   * @apiGroup DSProof
   * @apiDescription Get information for a double-spend proof.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/dsproof/getdsproof/a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d" -H "accept: application/json"
   *
   *
   */
  async getDSProof (req, res, next) {
    try {
      const txid = req.params.txid

      let verbose = 2 // default
      if (req.query.verbose === 'true') verbose = 3

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
          error: `txid must be of length 64 (not ${txid.length})`
        })
      }

      const options = _this.routeUtils.getAxiosOptions()
      options.data.id = 'getdsproof'
      options.data.method = 'getdsproof'
      options.data.params = [txid, verbose]

      const response = await _this.axios.request(options)
      return res.json(response.data.result)
    } catch (err) {
      wlogger.error('Error in dsproof.js/getDSProof().', err)

      return _this.errorHandler(err, res)
    }
  }
}

module.exports = DSProof
