'use strict'

const express = require('express')
const router = express.Router()

const axios = require('axios')

// const routeUtils = require('../route-utils')
const wlogger = require('../../../util/winston-logging')

const RouteUtils = require('../../../util/route-utils')
const routeUtils = new RouteUtils()

// Used for processing error messages before sending them to the user.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

let _this

class Control {
  constructor() {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/getNetworkInfo', _this.getNetworkInfo)
  }

  root(req, res, next) {
    return res.json({ status: 'control' })
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

  /**
   * @api {get} /control/getnetworkinfo Get Network Info
   * @apiName GetNetworkInfo
   * @apiGroup Control
   * @apiDescription RPC call which gets basic full node information.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/control/getnetworkinfo" -H "accept: application/json"
   *
   */
  async getNetworkInfo(req, res, next) {
    // Axios options
    const options = _this.routeUtils.getAxiosOptions()

    options.data.id = 'getnetworkinfo'
    options.data.method = 'getnetworkinfo'
    options.data.params = []

    try {
      // const response = await BitboxHTTP(requestConfig)
      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (error) {
      wlogger.error('Error in control.ts/getNetworkInfo().', error)

      return _this.errorHandler(error, res)
    }
  }
  // router.get('/getMemoryInfo', (req, res, next) => {
  //   BitboxHTTP({
  //     method: 'post',
  //     auth: {
  //       username: username,
  //       password: password
  //     },
  //     data: {
  //       jsonrpc: "1.0",
  //       id:"getmemoryinfo",
  //       method: "getmemoryinfo"
  //     }
  //   })
  //   .then((response) => {
  //     res.json(response.data.result);
  //   })
  //   .catch((error) => {
  //     res.send(error.response.data.error.message);
  //   });
  // });
  //
  // router.get('/help', (req, res, next) => {
  //   BITBOX.Control.help()
  //   .then((result) => {
  //     res.json(result);
  //   }, (err) => { console.log(err);
  //   });
  // });
  //
  // router.post('/stop', (req, res, next) => {
  //   BITBOX.Control.stop()
  //   .then((result) => {
  //     res.json(result);
  //   }, (err) => { console.log(err);
  //   });
  // });
}

module.exports = Control
