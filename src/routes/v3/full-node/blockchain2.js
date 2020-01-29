/*
  A library for interacting with the Full Node
*/

"use strict"

const express = require("express")
const router = express.Router()

const axios = require("axios")
const wlogger = require("../../../util/winston-logging")

const RouteUtils = require("../route-utils2")
const routeUtils = new RouteUtils()

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

let _this

class Blockchain {
  constructor() {
    _this = this

    this.bchjs = bchjs
    this.axios = axios
    this.routeUtils = routeUtils

    this.router = router
    this.router.get("/", this.root)
    this.router.get("/getBestBlockHash", this.getBestBlockHash)
    this.router.get("/getBlockchainInfo", this.getBlockchainInfo)
  }

  root(req, res, next) {
    return res.json({ status: "blockchain" })
  }

  // DRY error handler.
  errorHandler(err, res) {
    // Attempt to decode the error message.
    const { msg, status } = this.routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }

  /**
   * @api {get} /blockchain/getBestBlockHash Get best block hash
   * @apiName GetBestBlockHash
   * @apiGroup Blockchain
   * @apiDescription Returns the hash of the best (tip) block in the longest
   * block chain.
   *
   * @apiExample Example usage:
   * curl -X GET "https://mainnet.bchjs.cash/v3/blockchain/getBestBlockHash" -H "accept: application/json"
   *
   * @apiSuccess {String}   bestBlockHash           000000000000000002bc884334336d99c9a9c616670a9244c6a8c1fc35aa91a1
   */
  async getBestBlockHash(req, res, next) {
    try {
      // Axios options
      const options = this.routeUtils.getAxiosOptions()
      options.data.id = "getbestblockhash"
      options.data.method = "getbestblockhash"
      options.data.params = []

      const response = await this.axios.request(options)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      wlogger.error(`Error in blockchain.ts/getBestBlockHash().`, err)

      return this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getBlockchainInfo Get blockchain info
   * @apiName GetBlockchainInfo
   * @apiGroup Blockchain
   * @apiDescription Returns an object containing various state info regarding blockchain processing.
   *
   * @apiExample Example usage:
   * curl -X GET "https://mainnet.bchjs.cash/v3/blockchain/getBlockchainInfo" -H "accept: application/json"
   *
   * @apiSuccess {Object}   object                      Object containing data
   * @apiSuccess {String}   object.chain                "main"
   * @apiSuccess {Number}   object.blocks               561838
   * @apiSuccess {Number}   object.headers              561838
   * @apiSuccess {String}   object.bestblockhash        "000000000000000002307dd38cd01c7308b8febfcdf5772cf087b5bb023d55bc"
   * @apiSuccess {Number}   object.difficulty           246585566638.1496
   * @apiSuccess {String}   object.mediantime           1545402693
   * @apiSuccess {Number}   object.verificationprogress 0.999998831622689
   * @apiSuccess {Boolean}  object.chainwork            "000000000000000000000000000000000000000000d8c09a8ab7262080266b3e"
   * @apiSuccess {Number}   object.pruned               false
   * @apiSuccess {Array}    object.softforks            Array of objects
   * @apiSuccess {String}   object.softforks.id         "bip34"
   * @apiSuccess {String}   object.softforks.version    2
   * @apiSuccess {Object}   object.softforks.reject
   * @apiSuccess {String}   object.softforks.reject.status true
   */
  async getBlockchainInfo(req, res, next) {
    try {
      // Axios options
      const options = this.routeUtils.getAxiosOptions()
      options.data.id = "getblockchaininfo"
      options.data.method = "getblockchaininfo"
      options.data.params = []

      const response = await this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      wlogger.error(`Error in blockchain.ts/getBlockchainInfo().`, err)

      return this.errorHandler(err, res)
    }
  }
}

module.exports = Blockchain
