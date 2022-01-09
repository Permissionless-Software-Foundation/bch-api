/*
  Routes for interacting with the psf-slp-indexer
*/

// Public npm libraries
const express = require('express')
const router = express.Router()
const axios = require('axios')

// Local libraries
// const wlogger = require('../../../util/winston-logging')
// const config = require('../../../../config')

class PsfSlpIndexer {
  constructor () {
    // Encapsulate dependencies
    this.axios = axios
    this.router = router

    // Define routes
    // this.router.get('/', this.root)
    // this.router.get('/status', this.getStatus)
    // this.router.post('/address', this.getAddress)
    // this.router.post('/txid', this.getTxid)
    // this.routner.post('/token', this.getTokenStats)
  }
}

module.exports = PsfSlpIndexer
