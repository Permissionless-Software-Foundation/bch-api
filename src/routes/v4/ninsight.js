/*
  A library for interacting with the Bitcoin.com ninsight (not Insight) indexer.
*/

'use strict'

const express = require('express')
// const axios = require('axios')
// const routeUtils = require('./route-utils')
// const wlogger = require('../../util/winston-logging')

const router = express.Router()

// const BCHJS = require('@psf/bch-js')
// const bchjs = new BCHJS()

// let _this

class Ninsight {
  constructor () {
    // _this = this

    this.router = router
    this.router.get('/', this.root)
  }

  root (req, res, next) {
    return res.json({ status: 'ninsight' })
  }
}

module.exports = Ninsight
