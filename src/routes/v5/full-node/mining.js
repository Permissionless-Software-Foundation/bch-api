'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')

const RouteUtils = require('../../../util/route-utils')
const routeUtils = new RouteUtils()

const wlogger = require('../../../util/winston-logging')

// Used to convert error messages to strings, to safely pass to users.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

let _this

class Mining {
  constructor () {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/getMiningInfo', _this.getMiningInfo)
    _this.router.get('/getNetworkHashPS', _this.getNetworkHashPS)
  }

  root (req, res, next) {
    return res.json({ status: 'mining' })
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

  // router.get('/getBlockTemplate/:templateRequest', (req, res, next) => {
  //   BitboxHTTP({
  //     method: 'post',
  //     auth: {
  //       username: username,
  //       password: password
  //     },
  //     data: {
  //       jsonrpc: "1.0",
  //       id:"getblocktemplate",
  //       method: "getblocktemplate",
  //       params: [
  //         req.params.templateRequest
  //       ]
  //     }
  //   })
  //   .then((response) => {
  //     res.json(response.data.result);
  //   })
  //   .catch((error) => {
  //     res.send(error.response.data.error.message);
  //   });
  // });

  /**
   * @api {get} /mining/getMiningInfo  Get Mining Info.
   * @apiName Mining info.
   * @apiGroup Mining
   * @apiDescription Returns a json object containing mining-related information.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/mining/getMiningInfo" -H "accept: application/json"
   *
   *
   */
  async getMiningInfo (req, res, next) {
    try {
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getmininginfo'
      options.data.method = 'getmininginfo'
      options.data.params = []

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      wlogger.error('Error in mining.ts/getMiningInfo().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /mining/getNetworkHashps?nblocks=&height=  Get Estimated network hashes per second.
   * @apiName Estimated network hashes per second.
   * @apiGroup Mining
   * @apiDescription Returns the estimated network hashes per second based on the last n blocks. Pass in [blocks] to override # of blocks, -1 specifies since last difficulty change. Pass in [height] to estimate the network speed at the time when a certain block was found.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/mining/getNetworkHashps?nblocks=120&height=-1" -H "accept: application/json"
   *
   *
   */

  async getNetworkHashPS (req, res, next) {
    try {
      let nblocks = 120 // Default
      let height = -1 // Default
      if (req.query.nblocks) nblocks = parseInt(req.query.nblocks)
      if (req.query.height) height = parseInt(req.query.height)

      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getnetworkhashps'
      options.data.method = 'getnetworkhashps'
      options.data.params = [nblocks, height]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      wlogger.error('Error in mining.ts/getNetworkHashPS().', err)

      return _this.errorHandler(err, res)
    }
  }

  // router.post('/submitBlock/:hex', (req, res, next) => {
  //   let parameters = '';
  //   if(req.query.parameters && req.query.parameters !== '') {
  //     parameters = true;
  //   }
  //
  //   BitboxHTTP({
  //     method: 'post',
  //     auth: {
  //       username: username,
  //       password: password
  //     },
  //     data: {
  //       jsonrpc: "1.0",
  //       id:"submitblock",
  //       method: "submitblock",
  //       params: [
  //         req.params.hex,
  //         parameters
  //       ]
  //     }
  //   })
  //   .then((response) => {
  //     res.json(response.data.result);
  //   })
  //   .catch((error) => {
  //     res.send(error.response.data.error.message);
  //   });
  // });
}

module.exports = Mining
