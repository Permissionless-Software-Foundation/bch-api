/*
  Utility functions for troubleshooting a JWT token.
*/

'use strict'

// Public npm libraries.
const jwt = require('jsonwebtoken')
const axios = require('axios')

const express = require('express')
const router = express.Router()

const config = require('../../../config')
const wlogger = require('../../util/winston-logging')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

// Used for processing error messages before sending them to the user.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

let _this

class JWT {
  constructor () {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.jwt = jwt
    _this.config = config

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.post('/info', _this.jwtInfo)
  }

  root (req, res, next) {
    return res.json({ status: 'jwt' })
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

  /**
   * @api {post} /jwt/info Get JWT Info
   * @apiName GetJWTInfo
   * @apiGroup JWT
   * @apiDescription
   * Get info on your JWT token. Useful for debugging rate limit issues with your
   * JWT token.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v5/jwt/info" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZGRmZmI2NzRhM2Q2MDAxOTY3NjE1NCIsImVtYWlsIjoiY2hyaXNAYmNodGVzdC5uZXQiLCJhcGlMZXZlbCI6NjAsInJhdGVMaW1pdCI6MywicG9pbnRzVG9Db25zdW1lIjoxNiwiZHVyYXRpb24iOjMwLCJpYXQiOjE2MjU0MzQ2MzYsImv5cCI6MTYyODAyNjYzNn0.1WLugTkQKVG0yMXD1h5nxfho3gRzvSvs8NMa9obVhPM"}'
   *
   */
  async jwtInfo (req, res, next) {
    try {
      const jwtIn = req.body.jwt
      // console.log('jwt: ', jwtIn)
      // console.log('_this.config.apiTokenSecret: ', _this.config.apiTokenSecret)

      const decoded = _this.jwt.verify(jwtIn, _this.config.apiTokenSecret)
      // console.log('decoded: ', decoded)

      const expiration = new Date(decoded.exp * 1000)
      decoded.expiration = expiration.toISOString()

      const createdAt = new Date(decoded.iat * 1000)
      decoded.createdAt = createdAt.toISOString()

      res.status(200)
      return res.json(decoded)
    } catch (error) {
      // console.log('Error in jwt.js/jwtInfo().', error)
      wlogger.error('Error in jwt.js/jwtInfo().', error)

      return _this.errorHandler(error, res)
    }
  }
}

module.exports = JWT
