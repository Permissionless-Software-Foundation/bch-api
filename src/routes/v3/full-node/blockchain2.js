/*
  A library for interacting with the Full Node
*/

"use strict"

const express = require("express")
const router = express.Router()

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const axios = require("axios")
const routeUtils = require("../route-utils")
const wlogger = require("../../../util/winston-logging")

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

let _this

class Blockchain {
  constructor() {
    _this = this

    this.bchjs = bchjs
    this.axios = axios

    this.router = router
    this.router.get("/", this.root)
  }

  root(req, res, next) {
    return res.json({ status: "blockchain" })
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
      const options = routeUtils.getAxiosOptions()
      options.data.id = "getbestblockhash"
      options.data.method = "getbestblockhash"
      options.data.params = []

      const response = await this.axios.request(options)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return res.json(response.data.result)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      // Write out error to error log.
      //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error(`Error in blockchain.ts/getBestBlockHash().`, err)

      res.status(500)
      return res.json({ error: util.inspect(err) })
    }
  }
}

module.exports = Blockchain
