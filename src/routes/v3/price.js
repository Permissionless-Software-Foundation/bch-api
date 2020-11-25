/*
  This price route is really just a wrapper for another API price endpoint.
  The main reason for hosting this price wrapper is so that the price can
  be accessible over Tor. Tor is typically blocked by other REST API servers.
*/

'use strict'

const express = require('express')
const axios = require('axios')
const wlogger = require('../../util/winston-logging')
const util = require('util')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

let _this // Global context for 'this' instance of the Class.

class Price {
  constructor() {
    _this = this

    this.axios = axios
    this.routeUtils = routeUtils

    this.priceUrl = 'https://api.coinbase.com/v2/exchange-rates?currency=BCH'

    this.router = express.Router()
    this.router.get('/', _this.root)
    this.router.get('/usd', _this.getUSD)
    this.router.get('/rates', _this.getBCHRate)
  }

  // DRY error handler.
  errorHandler(err, res) {
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
  root(req, res, next) {
    return res.json({ status: 'price' })
  }

  /**
   * @api {get} /price/usd Get the USD price of BCH
   * @apiName Get the USD price of BCH
   * @apiGroup Price
   * @apiDescription Get the USD price of BCH
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/price/usd" -H "accept: application/json"
   *
   */
  async getUSD(req, res, next) {
    try {
      // Request options
      const opt = {
        method: 'get',
        baseURL: _this.priceUrl,
        timeout: 15000,
      }

      const response = await axios.request(opt)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return res.json({ usd: Number(response.data.data.rates.USD) })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in price.js/getUSD().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /price/usd Get rates for several different currencies
   * @apiName Get rates for several different currencies
   * @apiGroup Price
   * @apiDescription Get rates for several different currencies
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/price/rates" -H "accept: application/json"
   *
   */
  // Get rates for several different currencies
  async getBCHRate(req, res, next) {
    try {
      // Request options
      const opt = {
        method: 'get',
        baseURL: _this.priceUrl,
        timeout: 15000,
      }

      const response = await axios.request(opt)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return res.json(response.data.data.rates)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in price.js/getUSD().', err)

      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Price
