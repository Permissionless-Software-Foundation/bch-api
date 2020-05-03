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

let _this

class Encryption {
  constructor () {
    _this = this

    _this.config = config
    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs

    _this.router = router
    _this.router.get('/', _this.root)
    // _this.router.get('/publickey', _this.getPublicKey)
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
}

module.exports = Encryption
