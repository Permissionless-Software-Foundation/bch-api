/*
  This health-check API can be used to test the server for aliveness and
  readiness.
*/

'use strict'

const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({ status: true })
})

module.exports = router
