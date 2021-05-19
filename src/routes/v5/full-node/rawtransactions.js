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
class RawTransactions {
  constructor () {
    _this = this

    // Encapsulate external dependencies.
    this.axios = axios
    this.routeUtils = routeUtils

    // Define Express routes.
    this.router = router
    this.router.get('/', this.root)
    this.router.get(
      '/decodeRawTransaction/:hex',
      this.decodeRawTransactionSingle
    )
    this.router.post('/decodeRawTransaction', this.decodeRawTransactionBulk)
    this.router.get('/decodeScript/:hex', this.decodeScriptSingle)
    this.router.post('/decodeScript', this.decodeScriptBulk)
    this.router.post('/getRawTransaction', this.getRawTransactionBulk)
    this.router.get('/getRawTransaction/:txid', this.getRawTransactionSingle)
    this.router.post('/sendRawTransaction', this.sendRawTransactionBulk)
    this.router.get('/sendRawTransaction/:hex', this.sendRawTransactionSingle)
  }

  root (req, res, next) {
    return res.json({ status: 'rawtransactions' })
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

  // Decode transaction hex into a JSON object.
  // GET
  /**
   * @api {get} /rawtransactions/decodeRawTransaction/{hex} Decode Single Raw Transaction.
   * @apiName Decode Single Raw Transaction
   * @apiGroup Raw Transaction
   * @apiDescription Return a JSON object representing the serialized, hex-encoded transaction.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v4/rawtransactions/decodeRawTransaction/02000000010e991f7ccec410f27d333f737f149b5d3be6728687da81072e638aed0063a176010000006b483045022100cd20443b0af090053450bc4ab00d563d4ac5955bb36e0135b00b8a96a19f233302205047f2c70a08c6ef4b76f2d198b33a31d17edfaa7e1e9e865894da0d396009354121024d4e7f522f67105b7bf5f9dbe557e7b2244613fdfcd6fe09304f93877328f6beffffffff02a0860100000000001976a9140ee020c07f39526ac5505c54fa1ab98490979b8388acb5f0f70b000000001976a9143a9b2b0c12fe722fcf653b6ef5dcc38732d6ff5188ac00000000" -H "accept: application/json"
   */
  async decodeRawTransactionSingle (req, res, next) {
    try {
      const hex = req.params.hex

      // Throw an error if hex is empty.
      if (!hex || hex === '') {
        res.status(400)
        return res.json({ error: 'hex can not be empty' })
      }
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'decoderawtransaction'
      options.data.method = 'decoderawtransaction'
      options.data.params = [hex]

      const response = await _this.axios.request(options)
      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error(
        'Error in rawtransactions.ts/decodeRawTransactionSingle().',
        err
      )
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /rawtransactions/decodeRawTransaction Decode Bulk Raw Transactions.
   * @apiName  Decode Bulk Raw Transactions
   * @apiGroup Raw Transaction
   * @apiDescription Return bulk hex encoded transaction.
   *
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v4/rawtransactions/decodeRawTransaction" -H "accept: application/json" -H "Content-Type: application/json" -d '{"hexes":["01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000","01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000"]}'
   *
   *
   */
  async decodeRawTransactionBulk (req, res, next) {
    try {
      const hexes = req.body.hexes

      if (!Array.isArray(hexes)) {
        res.status(400)
        return res.json({ error: 'hexes must be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, hexes)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // const results = []

      // Validate each element in the address array.
      for (let i = 0; i < hexes.length; i++) {
        const thisHex = hexes[i]

        // Reject if id is empty
        if (!thisHex || thisHex === '') {
          res.status(400)
          return res.json({ error: 'Encountered empty hex' })
        }
      }

      const options = _this.routeUtils.getAxiosOptions()

      // Loop through each height and creates an array of requests to call in parallel
      const promises = hexes.map(async (hex) => {
        options.data.id = 'decoderawtransaction'
        options.data.method = 'decoderawtransaction'
        options.data.params = [hex]

        return _this.axios.request(options)
      })

      // Wait for all parallel Insight requests to return.
      const axiosResult = await _this.axios.all(promises)

      // Retrieve the data part of the result.
      const result = axiosResult.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/getRawTransaction: `, err)
      wlogger.error(
        'Error in rawtransactions.ts/decodeRawTransactionBulk().',
        err
      )
      return _this.errorHandler(err, res)
    }
  }

  // Decode a raw transaction from hex to assembly.
  // GET single
  /**
   * @api {get} /rawtransactions/decodeScript/{hex}  Decode Single Script.
   * @apiName  Decode Single Script
   * @apiGroup Raw Transaction
   * @apiDescription Decode a hex-encoded script.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v4/rawtransactions/decodeScript/4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16" -H "accept: application/json"
   *
   *
   */
  async decodeScriptSingle (req, res, next) {
    try {
      const hex = req.params.hex

      // Throw an error if hex is empty.
      if (!hex || hex === '') {
        res.status(400)
        return res.json({ error: 'hex can not be empty' })
      }

      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'decodescript'
      options.data.method = 'decodescript'
      options.data.params = [hex]

      const response = await _this.axios.request(options)
      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeScript: `, err)
      wlogger.error('Error in rawtransactions.ts/decodeScriptSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Decode a raw transaction from hex to assembly.
  // POST bulk
  /**
   * @api {post} /rawtransactions/decodeScript  Bulk Decode Script.
   * @apiName Bulk Decode Script
   * @apiGroup Raw Transaction
   * @apiDescription Decode multiple hex-encoded scripts.
   *
   *
   * @apiExample Example usage:
   *curl -X POST "https://api.fullstack.cash/v4/rawtransactions/decodeScript" -H "accept:" -H "Content-Type: application/json" -d '{"hexes":["01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000","01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000"]}'
   *
   *
   */
  async decodeScriptBulk (req, res, next) {
    try {
      const hexes = req.body.hexes

      // Validation
      if (!Array.isArray(hexes)) {
        res.status(400)
        return res.json({ error: 'hexes must be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, hexes)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Validate each hex in the array
      for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i]

        // Throw an error if hex is empty.
        if (!hex || hex === '') {
          res.status(400)
          return res.json({ error: 'Encountered empty hex' })
        }
      }

      const options = _this.routeUtils.getAxiosOptions()

      // Loop through each hex and create an array of promises
      const promises = hexes.map(async (hex) => {
        options.data.id = 'decodescript'
        options.data.method = 'decodescript'
        options.data.params = [hex]

        const response = await _this.axios.request(options)
        return response
      })

      // Wait for all parallel promises to return.
      const resolved = await Promise.all(promises)

      // Retrieve the data from each resolved promise.
      const result = resolved.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeScript: `, err)
      wlogger.error('Error in rawtransactions.ts/decodeScriptBulk().', err)
      return _this.errorHandler(err, res)
    }
  }

  // Retrieve raw transactions details from the full node.

  async getRawTransactionsFromNode (txid, verbose) {
    try {
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getrawtransaction'
      options.data.method = 'getrawtransaction'
      options.data.params = [txid, verbose]

      const response = await _this.axios.request(options)

      return response.data.result
    } catch (err) {
      wlogger.error('Error in rawtransactions.ts/getRawTransactionsFromNode().')
      throw err
    }
  }

  // Get a JSON object breakdown of transaction details.
  // POST
  /**
   * @api {post} /rawtransactions/getRawTransaction  Get Bulk Raw Transactions.
   * @apiName Get Bulk Raw Transactions.
   * @apiGroup Raw Transaction
   * @apiDescription Return the raw transaction data for multiple transactions. If verbose is 'true', returns an Object with information about 'txid'. If verbose is 'false' or omitted, returns a string that is serialized, hex-encoded data for 'txid'.
   *
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v4/rawtransactions/getRawTransaction" -H "accept: application/json" -H "Content-Type: application/json" -d '{"txids":["a5f972572ee1753e2fd2457dd61ce5f40fa2f8a30173d417e49feef7542c96a1","5165dc531aad05d1149bb0f0d9b7bda99c73e2f05e314bcfb5b4bb9ca5e1af5e"],"verbose":true}'
   *
   */
  async getRawTransactionBulk (req, res, next) {
    try {
      let verbose = 0
      if (req.body.verbose) verbose = 1

      const txids = req.body.txids
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({ error: 'txids must be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, txids)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Validate each txid in the array.
      for (let i = 0; i < txids.length; i++) {
        const txid = txids[i]

        if (!txid || txid === '') {
          res.status(400)
          return res.json({ error: 'Encountered empty TXID' })
        }

        if (txid.length !== 64) {
          res.status(400)
          return res.json({
            error: `parameter 1 must be of length 64 (not ${txid.length})`
          })
        }
      }

      // Loop through each txid and create an array of promises
      const promises = txids.map(async (txid) =>
        _this.getRawTransactionsFromNode(txid, verbose)
      )

      // Wait for all parallel promises to return.
      const axiosResult = await _this.axios.all(promises)

      res.status(200)
      return res.json(axiosResult)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/getRawTransaction: `, err)
      wlogger.error('Error in rawtransactions.ts/getRawTransactionBulk().', err)
      return _this.errorHandler(err, res)
    }
  }

  // Get a JSON object breakdown of transaction details.
  // GET
  /**
   * @api {get} /rawtransactions/getRawTransaction/{txid}  Return the raw transaction data.
   * @apiName Get Raw Transaction
   * @apiGroup Raw Transaction
   * @apiDescription return the raw transaction data. If verbose is 'true', returns an Object with information about 'txid'. If verbose is 'false' or omitted, returns a string that is serialized, hex-encoded data for 'txid'.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v4/rawtransactions/getRawTransaction/fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33?verbose=true" -H "accept: application/json"
   *
   *
   */
  async getRawTransactionSingle (req, res, next) {
    try {
      let verbose = 0
      if (req.query.verbose === 'true') verbose = 1

      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      if (txid.length !== 64) {
        res.status(400)
        return res.json({
          error: `parameter 1 must be of length 64 (not ${txid.length})`
        })
      }

      const data = await _this.getRawTransactionsFromNode(txid, verbose)

      return res.json(data)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/getRawTransaction: `, err)
      wlogger.error(
        'Error in rawtransactions.ts/getRawTransactionSingle().',
        err
      )

      return _this.errorHandler(err, res)
    }
  }

  // Transmit a raw transaction to the BCH network.
  /**
   * @api {post} /rawtransactions/sendRawTransaction  Send Bulk Raw Transactions.
   * @apiName Send Bulk Raw Transactions
   * @apiGroup Raw Transaction
   * @apiDescription Submits multiple raw transaction (serialized, hex-encoded) to local node and network.
   *
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v4/rawtransactions/sendRawTransaction" -H "accept:application/json" -H "Content-Type: application/json" -d '{"hexes":["01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000","01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000"]}'
   *
   *
   */
  async sendRawTransactionBulk (req, res, next) {
    try {
      // Validation
      const hexes = req.body.hexes

      // Reject if input is not an array
      if (!Array.isArray(hexes)) {
        res.status(400)
        return res.json({ error: 'hex must be an array' })
      }

      let options = _this.routeUtils.getAxiosOptions()
      options = _this.sendTxOptions(options)

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, hexes)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Validate each element
      for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i]

        if (hex === '') {
          res.status(400)
          return res.json({
            error: 'Encountered empty hex'
          })
        }
      }

      // Dev Note CT 1/31/2019:
      // Sending the 'sendrawtrnasaction' RPC call to a full node in parallel will
      // not work. Testing showed that the full node will return the same TXID for
      // different TX hexes. I believe this is by design, to prevent double spends.
      // In parallel, we are essentially asking the node to broadcast a new TX before
      // it's finished broadcast the previous one. Serial execution is required.

      // How to send TX hexes in parallel the WRONG WAY:
      /*
          // Collect an array of promises.
          const promises = hexes.map(async (hex: any) => {
            requestConfig.data.id = "sendrawtransaction"
            requestConfig.data.method = "sendrawtransaction"
            requestConfig.data.params = [hex]
            return await BitboxHTTP(requestConfig)
          })
          // Wait for all parallel Insight requests to return.
          const axiosResult: Array<any> = await axios.all(promises)
          // Retrieve the data part of the result.
          const result = axiosResult.map(x => x.data.result)
          */

      // Sending them serially.
      const result = []
      for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i]

        options.data.id = 'sendrawtransaction'
        options.data.method = 'sendrawtransaction'
        options.data.params = [hex]

        const rpcResult = await _this.axios.request(options)

        result.push(rpcResult.data.result)
      }

      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error(
        'Error in rawtransactions.ts/sendRawTransactionBulk().',
        err
      )
      return _this.errorHandler(err, res)
    }
  }

  // Transmit a raw transaction to the BCH network.
  /**
   * @api {get} /rawtransactions/sendRawTransaction/{hex}  Send Single Raw Transaction.
   * @apiName Send Single Raw Transaction
   * @apiGroup Raw Transaction
   * @apiDescription Submits single raw transaction (serialized, hex-encoded) to local node and network.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v4/rawtransactions/sendRawTransaction/01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000" -H "accept: "
   *
   *
   */
  async sendRawTransactionSingle (req, res, next) {
    try {
      const hex = req.params.hex // URL parameter

      // Reject if input is not an array or a string
      if (typeof hex !== 'string') {
        res.status(400)
        return res.json({ error: 'hex must be a string' })
      }

      // Validation
      if (hex === '') {
        res.status(400)
        return res.json({
          error: 'Encountered empty hex'
        })
      }

      let options = _this.routeUtils.getAxiosOptions()
      options = _this.sendTxOptions(options)

      // RPC call
      options.data.id = 'sendrawtransaction'
      options.data.method = 'sendrawtransaction'
      options.data.params = [hex]

      const rpcResult = await _this.axios.request(options)

      const result = rpcResult.data.result

      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error(
        'Error in rawtransactions.ts/sendRawTransactionSingle().',
        err
      )
      return _this.errorHandler(err, res)
    }
  }

  // This method modifies the default axios options. It attempts to inject
  // a specific full node to use when broadcasting transactions. This is useful
  // because it leverages the built-in protections that a full node has against
  // accidental double spends. It mitigates a corner-case when rapidly spending
  // TXs on load balanced nodes. By piping all TX sends through a single node,
  // accidental double spends can be reduced.
  sendTxOptions (options) {
    try {
      const sendUrl = process.env.RPC_SENDURL

      if (sendUrl !== 'undefined' && sendUrl !== undefined) {
        // console.log(`original options: ${JSON.stringify(options, null, 2)}`)

        options.baseURL = process.env.RPC_SENDURL

        // console.log(`modified options: ${JSON.stringify(options, null, 2)}`)
      }

      return options
    } catch (err) {
      wlogger.error('Error in rawtransactions.js/sendTxOptions()')
      throw err
    }
  }
}

module.exports = RawTransactions
