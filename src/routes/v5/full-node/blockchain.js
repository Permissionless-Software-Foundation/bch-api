/*
  A library for interacting with the Full Node
*/

'use strict'

const express = require('express')
const router = express.Router()

const axios = require('axios')
const wlogger = require('../../../util/winston-logging')

const RouteUtils = require('../../../util/route-utils')
const routeUtils = new RouteUtils()

// Used to convert error messages to strings, to safely pass to users.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

let _this

class Blockchain {
  constructor () {
    _this = this

    this.bchjs = bchjs
    this.axios = axios
    this.routeUtils = routeUtils

    this.router = router
    this.router.get('/', this.root)
    this.router.get('/getBestBlockHash', this.getBestBlockHash)
    this.router.get('/getBlockchainInfo', this.getBlockchainInfo)
    this.router.get('/getBlockCount', this.getBlockCount)
    this.router.get('/getBlockHeader/:hash', this.getBlockHeaderSingle)
    this.router.post('/getBlockHeader', this.getBlockHeaderBulk)
    this.router.get('/getChainTips', this.getChainTips)
    this.router.get('/getDifficulty', this.getDifficulty)
    this.router.get('/getMempoolEntry/:txid', this.getMempoolEntrySingle)
    this.router.post('/getMempoolEntry', this.getMempoolEntryBulk)
    this.router.get(
      '/getMempoolAncestors/:txid',
      this.getMempoolAncestorsSingle
    )
    this.router.get('/getMempoolInfo', this.getMempoolInfo)
    this.router.get('/getRawMempool', this.getRawMempool)
    this.router.get('/getTxOut/:txid/:n', this.getTxOut)
    this.router.post('/getTxOut', this.getTxOutPost)
    this.router.get('/getTxOutProof/:txid', this.getTxOutProofSingle)
    this.router.post('/getTxOutProof', this.getTxOutProofBulk)
    this.router.get('/verifyTxOutProof/:proof', this.verifyTxOutProofSingle)
    this.router.post('/verifyTxOutProof', this.verifyTxOutProofBulk)
    this.router.post('/getBlock', this.getBlock)
    this.router.get('/getBlockHash/:height', this.getBlockHash)
  }

  root (req, res, next) {
    return res.json({ status: 'blockchain' })
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
   * @api {get} /blockchain/getBestBlockHash Get best block hash
   * @apiName GetBestBlockHash
   * @apiGroup Blockchain
   * @apiDescription Returns the hash of the best (tip) block in the longest
   * block chain.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getBestBlockHash" -H "accept: application/json"
   *
   * @apiSuccess {String}   bestBlockHash           000000000000000002bc884334336d99c9a9c616670a9244c6a8c1fc35aa91a1
   */
  async getBestBlockHash (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()
      options.data.id = 'getbestblockhash'
      options.data.method = 'getbestblockhash'
      options.data.params = []

      const response = await _this.axios.request(options)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockchain.ts/getBestBlockHash().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getBlockchainInfo Get blockchain info
   * @apiName GetBlockchainInfo
   * @apiGroup Blockchain
   * @apiDescription Returns an object containing various state info regarding blockchain processing.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getBlockchainInfo" -H "accept: application/json"
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
  async getBlockchainInfo (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()
      options.data.id = 'getblockchaininfo'
      options.data.method = 'getblockchaininfo'
      options.data.params = []

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockchain.ts/getBlockchainInfo().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getBlockCount Get Block Count
   * @apiName GetBlockCount
   * @apiGroup Blockchain
   * @apiDescription Returns the number of blocks in the longest blockchain.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getBlockCount" -H "accept: application/json"
   *
   * @apiSuccess {Number} bestBlockCount  587665
   */
  async getBlockCount (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()
      options.data.id = 'getblockcount'
      options.data.method = 'getblockcount'
      options.data.params = []

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getBlockCount().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getBlockHeader/:hash Get single block header
   * @apiName GetSingleBlockHeader
   * @apiGroup Blockchain
   * @apiDescription If verbose is false (default), returns a string that is
   * serialized, hex-encoded data for blockheader 'hash'. If verbose is true,
   * returns an Object with information about blockheader hash.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getBlockHeader/000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201?verbose=true" -H "accept: application/json"
   *
   * @apiParam {String} hash block hash
   * @apiParam {Boolean} verbose Return verbose data
   *
   * @apiSuccess {Object}   object                      Object containing data
   * @apiSuccess {String}   object.hash                "000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201"
   * @apiSuccess {Number}   object.confirmations       61839
   * @apiSuccess {Number}   object.height              500000
   * @apiSuccess {Number}   object.version             536870912
   * @apiSuccess {String}   object.versionHex          "20000000"
   * @apiSuccess {String}   object.merkleroot          "4af279645e1b337e655ae3286fc2ca09f58eb01efa6ab27adedd1e9e6ec19091"
   * @apiSuccess {Number}   object.time                1509343584
   * @apiSuccess {Number}   object.mediantime          1509336533
   * @apiSuccess {Number}   object.nonce               3604508752
   * @apiSuccess {String}   object.bits                "1809b91a"
   * @apiSuccess {Number}   object.difficulty          113081236211.4533
   * @apiSuccess {String}   object.chainwork           "0000000000000000000000000000000000000000007ae48aca46e3b449ad9714"
   * @apiSuccess {String}   object.previousblockhash   "0000000000000000043831d6ebb013716f0580287ee5e5687e27d0ed72e6e523"
   * @apiSuccess {String}   object.nextblockhash       "00000000000000000568f0a96bf4348847bc84e455cbfec389f27311037a20f3"
   */
  async getBlockHeaderSingle (req, res, next) {
    try {
      let verbose = false
      if (req.query.verbose && req.query.verbose.toString() === 'true') {
        verbose = true
      }

      const hash = req.params.hash
      if (!hash || hash === '') {
        res.status(400)
        return res.json({ error: 'hash can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()
      options.data.id = 'getblockheader'
      options.data.method = 'getblockheader'
      options.data.params = [hash, verbose]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getBlockHeaderSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockchain/getBlockHeader Get multiple block headers
   * @apiName GetBulkBlockHeader
   * @apiGroup Blockchain
   * @apiDescription If verbose is false (default), returns a string that is
   * serialized, hex-encoded data for blockheader 'hash'. If verbose is true,
   * returns an Object with information about blockheader hash.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v5/blockchain/getBlockHeader" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"hashes\":[\"000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201\",\"00000000000000000568f0a96bf4348847bc84e455cbfec389f27311037a20f3\"],\"verbose\":true}"
   *
   * @apiParam {String} hash block hash
   * @apiParam {Boolean} verbose Return verbose data
   *
   * @apiSuccess {Array}    array                      array containing objects
   * @apiSuccess {String}   object.hash                "000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201"
   * @apiSuccess {Number}   object.confirmations       61839
   * @apiSuccess {Number}   object.height              500000
   * @apiSuccess {Number}   object.version             536870912
   * @apiSuccess {String}   object.versionHex          "20000000"
   * @apiSuccess {String}   object.merkleroot          "4af279645e1b337e655ae3286fc2ca09f58eb01efa6ab27adedd1e9e6ec19091"
   * @apiSuccess {Number}   object.time                1509343584
   * @apiSuccess {Number}   object.mediantime          1509336533
   * @apiSuccess {Number}   object.nonce               3604508752
   * @apiSuccess {String}   object.bits                "1809b91a"
   * @apiSuccess {Number}   object.difficulty          113081236211.4533
   * @apiSuccess {String}   object.chainwork           "0000000000000000000000000000000000000000007ae48aca46e3b449ad9714"
   * @apiSuccess {String}   object.previousblockhash   "0000000000000000043831d6ebb013716f0580287ee5e5687e27d0ed72e6e523"
   * @apiSuccess {String}   object.nextblockhash       "00000000000000000568f0a96bf4348847bc84e455cbfec389f27311037a20f3"
   */
  async getBlockHeaderBulk (req, res, next) {
    try {
      const hashes = req.body.hashes
      const verbose = req.body.verbose ? req.body.verbose : false

      if (!Array.isArray(hashes)) {
        res.status(400)
        return res.json({
          error: 'hashes needs to be an array. Use GET for single hash.'
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, hashes)) {
        res.status(400) // https://github.com/Bitcoin-com/api.fullstack.cash/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      wlogger.debug(
        'Executing blockchain/getBlockHeaderBulk with these hashes: ',
        hashes
      )

      // Validate each hash in the array.
      for (let i = 0; i < hashes.length; i++) {
        const hash = hashes[i]

        if (hash.length !== 64) {
          res.status(400)
          return res.json({ error: `This is not a hash: ${hash}` })
        }
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      // Loop through each hash and creates an array of requests to call in parallel
      const promises = hashes.map(async (hash) => {
        options.data.id = 'getblockheader'
        options.data.method = 'getblockheader'
        options.data.params = [hash, verbose]

        return _this.axios.request(options)
      })

      const axiosResult = await _this.axios.all(promises)

      // Extract the data component from the axios response.
      const result = axiosResult.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getBlockHeaderBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getChainTips Get Chain Tips
   * @apiName getChainTips
   * @apiGroup Blockchain
   * @apiDescription Return information about all known tips in the block tree,
   * including the main chain as well as orphaned branches.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getChainTips" -H "accept: application/json"
   *
   */
  async getChainTips (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getchaintips'
      options.data.method = 'getchaintips'
      options.data.params = []

      const response = await _this.axios.request(options)
      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getChainTips().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getDifficulty Get difficulty
   * @apiName getDifficulty
   * @apiGroup Blockchain
   * @apiDescription Get the current difficulty value, used to regulate mining
   * power on the network.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getDifficulty" -H "accept: application/json"
   *
   */
  async getDifficulty (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getdifficulty'
      options.data.method = 'getdifficulty'
      options.data.params = []

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getDifficulty().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getMempoolEntry/:txid Get single mempool entry
   * @apiName getMempoolEntry
   * @apiGroup Blockchain
   * @apiDescription Returns mempool data for given transaction. TXID must be in
   * mempool (unconfirmed)
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getMempoolEntry/fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33" -H "accept: application/json"
   *
   */
  async getMempoolEntrySingle (req, res, next) {
    try {
      // Validate input parameter
      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getmempoolentry'
      options.data.method = 'getmempoolentry'
      options.data.params = [txid]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getMempoolEntrySingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockchain/getMempoolEntry Get bulk mempool entry
   * @apiName getMempoolEntryBulk
   * @apiGroup Blockchain
   * @apiDescription Returns mempool data for multiple transactions
   *
   * @apiExample Example usage:
   * curl -X POST https://api.fullstack.cash/v5/blockchain/getMempoolEntry -H "Content-Type: application/json" -d "{\"txids\":[\"a5f972572ee1753e2fd2457dd61ce5f40fa2f8a30173d417e49feef7542c96a1\",\"5165dc531aad05d1149bb0f0d9b7bda99c73e2f05e314bcfb5b4bb9ca5e1af5e\"]}"
   */
  async getMempoolEntryBulk (req, res, next) {
    try {
      const txids = req.body.txids

      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({
          error: 'txids needs to be an array. Use GET for single txid.'
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, txids)) {
        res.status(400) // https://github.com/Bitcoin-com/api.fullstack.cash/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      wlogger.debug(
        'Executing blockchain/getMempoolEntry with these txids: ',
        txids
      )

      // Validate each element in the array
      for (let i = 0; i < txids.length; i++) {
        const txid = txids[i]

        if (txid.length !== 64) {
          res.status(400)
          return res.json({ error: 'This is not a txid' })
        }
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      // Loop through each txid and creates an array of requests to call in parallel
      const promises = txids.map(async (txid) => {
        options.data.id = 'getmempoolentry'
        options.data.method = 'getmempoolentry'
        options.data.params = [txid]

        return _this.axios.request(options)
      })

      const axiosResult = await _this.axios.all(promises)

      // Extract the data component from the axios response.
      const result = axiosResult.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getMempoolEntryBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getMempoolAncestors/:txid Get Mempool Ancestors
   * @apiName getMempoolAncestors
   * @apiGroup Blockchain
   * @apiDescription Returns mempool ancestors data for given TXID. It must be in
   * mempool (unconfirmed). This call is handy to tell if a UTXO is bumping up
   * against the 25 ancestor chain-limit.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getMempoolAncestors/fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33" -H "accept: application/json"
   *
   */
  async getMempoolAncestorsSingle (req, res, next) {
    try {
      // Validate input parameter
      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      let verbose = req.params.verbose
      if (verbose === undefined) verbose = false

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getmempoolancestors'
      options.data.method = 'getmempoolancestors'
      options.data.params = [txid, verbose]

      const response = await _this.axios.request(options)
      // console.log(`response: ${util.inspect(response)}`)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getMempoolAncestorsSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getMempoolInfo Get mempool info
   * @apiName getMempoolInfo
   * @apiGroup Blockchain
   * @apiDescription Returns details on the active state of the TX memory pool.
   *
   * @apiExample Example usage:
   * curl -X GET https://api.fullstack.cash/v5/getMempoolInfo -H "accept: application/json"
   *
   */
  async getMempoolInfo (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getmempoolinfo'
      options.data.method = 'getmempoolinfo'
      options.data.params = []

      const response = await _this.axios.request(options)
      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getMempoolInfo().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getRawMempool Get mempool info
   * @apiName getMempoolInfo
   * @apiGroup Blockchain
   * @apiDescription Returns details on the active state of the TX memory pool.
   *
   * @apiExample Example usage:
   * curl -X GET https://api.fullstack.cash/v5/getMempoolInfo -H "accept: application/json"
   *
   */

  /**
   * @api {get} /blockchain/getRawMempool/?verbose= Get raw mempool
   * @apiName getRawMempool
   * @apiGroup Blockchain
   * @apiDescription Returns all transaction ids in memory pool as a json array
   * of string transaction ids.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/getRawMempool/?verbose=true" -H "accept: application/json"
   *
   * @apiParam {Boolean} verbose Return verbose data
   *
   */
  async getRawMempool (req, res, next) {
    try {
      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      let verbose = false
      if (req.query.verbose && req.query.verbose === 'true') verbose = true

      options.data.id = 'getrawmempool'
      options.data.method = 'getrawmempool'
      options.data.params = [verbose]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getRawMempool().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getTxOut/:txid/:n?mempool= Get Tx Out
   * @apiName getTxOut
   * @apiGroup Blockchain
   * @apiDescription Returns details about an unspent transaction output.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getTxOut/fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33/0?mempool=false" -H "accept: application/json"
   *
   * @apiParam {String} txid Transaction id (required)
   * @apiParam {Number} n Output number (required)
   * @apiParam {Boolean} mempool Check mempool or not (optional)
   *
   */
  // Returns details about an unspent transaction output.
  async getTxOut (req, res, next) {
    try {
      // Validate input parameter
      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      let n = req.params.n
      if (n === undefined || n === '') {
        res.status(400)
        return res.json({ error: 'n can not be empty' })
      }
      n = parseInt(n)

      let includeMempool = false
      if (req.query.includeMempool && req.query.includeMempool === 'true') {
        includeMempool = true
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'gettxout'
      options.data.method = 'gettxout'
      options.data.params = [txid, n, includeMempool]

      // console.log(`requestConfig: ${JSON.stringify(requestConfig, null, 2)}`)

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getTxOut().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockchain/getTxOut Validate a UTXO
   * @apiName getTxOut
   * @apiGroup Blockchain
   * @apiDescription Returns details about an unspent transaction output (UTXO).
   *
   * @apiExample Example usage:
   * curl "https://api.fullstack.cash/v5/blockchain/getTxOut/" -X POST -H "Content-Type: application/json" --data-binary '{"txid":"d5228d2cdc77fbe5a9aa79f19b0933b6802f9f0067f42847fc4fe343664723e5","vout":0,"mempool":true}'
   *
   * @apiParam {String} txid Transaction id (required)
   * @apiParam {Number} vout of transaction (required)
   * @apiParam {Boolean} mempool Check mempool or not (optional)
   *
   */
  // Returns details about an unspent transaction output.
  async getTxOutPost (req, res, next) {
    try {
      const txid = req.body.txid
      let n = req.body.vout
      const mempool = req.body.mempool ? req.body.mempool : true

      // Validate input parameter
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      if (n === undefined || n === '') {
        res.status(400)
        return res.json({ error: 'vout can not be empty' })
      }
      n = parseInt(n)

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'gettxout'
      options.data.method = 'gettxout'
      options.data.params = [txid, n, mempool]

      // console.log(`requestConfig: ${JSON.stringify(requestConfig, null, 2)}`)

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getTxOutPost().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /blockchain/getTxOutProofSingle/:txid Get Tx Out Proof
   * @apiName getTxOutProofSingle
   * @apiGroup Blockchain
   * @apiDescription Returns a hex-encoded proof that 'txid' was included in a block.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getTxOutProofSingle/fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33" -H "accept: application/json"
   *
   * @apiParam {String} txid Transaction id (required)
   *
   */
  async getTxOutProofSingle (req, res, next) {
    try {
      // Validate input parameter
      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'gettxoutproof'
      options.data.method = 'gettxoutproof'
      options.data.params = [[txid]]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getTxOutProofSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a hex-encoded proof that 'txid' was included in a block.
  async getTxOutProofBulk (req, res, next) {
    try {
      const txids = req.body.txids

      // Reject if txids is not an array.
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({
          error: 'txids needs to be an array. Use GET for single txid.'
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, txids)) {
        res.status(400) // https://github.com/Bitcoin-com/api.fullstack.cash/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      // Validate each element in the array.
      for (let i = 0; i < txids.length; i++) {
        const txid = txids[i]

        if (txid.length !== 64) {
          res.status(400)
          return res.json({
            error: `Invalid txid. Double check your txid is valid: ${txid}`
          })
        }
      }

      wlogger.debug(
        'Executing blockchain/getTxOutProof with these txids: ',
        txids
      )

      // Loop through each txid and creates an array of requests to call in parallel
      const promises = txids.map(async (txid) => {
        options.data.id = 'gettxoutproof'
        options.data.method = 'gettxoutproof'
        options.data.params = [[txid]]

        return _this.axios.request(options)
      })

      // Wait for all parallel promisses to resolve.
      const axiosResult = await _this.axios.all(promises)

      // Extract the data component from the axios response.
      const result = axiosResult.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/getTxOutProofBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  async verifyTxOutProofSingle (req, res, next) {
    try {
      // Validate input parameter
      const proof = req.params.proof
      if (!proof || proof === '') {
        res.status(400)
        return res.json({ error: 'proof can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'verifytxoutproof'
      options.data.method = 'verifytxoutproof'
      options.data.params = [req.params.proof]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/verifyTxOutProofSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  async verifyTxOutProofBulk (req, res, next) {
    try {
      const proofs = req.body.proofs

      // Reject if proofs is not an array.
      if (!Array.isArray(proofs)) {
        res.status(400)
        return res.json({
          error: 'proofs needs to be an array. Use GET for single proof.'
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, proofs)) {
        res.status(400) // https://github.com/Bitcoin-com/api.fullstack.cash/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      // Validate each element in the array.
      for (let i = 0; i < proofs.length; i++) {
        const proof = proofs[i]

        if (!proof || proof === '') {
          res.status(400)
          return res.json({ error: `proof can not be empty: ${proof}` })
        }
      }

      wlogger.debug(
        'Executing blockchain/verifyTxOutProof with these proofs: ',
        proofs
      )

      // Loop through each proof and creates an array of requests to call in parallel
      const promises = proofs.map(async (proof) => {
        options.data.id = 'verifytxoutproof'
        options.data.method = 'verifytxoutproof'
        options.data.params = [proof]

        return _this.axios.request(options)
      })

      // Wait for all parallel promisses to resolve.
      const axiosResult = await _this.axios.all(promises)

      // Extract the data component from the axios response.
      const result = axiosResult.map((x) => x.data.result[0])

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.ts/verifyTxOutProofBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockchain/getBlock/ Get block details
   * @apiName getBlock
   * @apiGroup Blockchain
   * @apiDescription Returns block details
   *
   * @apiExample Example usage:
   * curl "https://api.fullstack.cash/v5/blockchain/getblock/" -X POST -H "Content-Type: application/json" --data-binary '{"blockhash":"000000000000000002a5fe0bdd6e3f04342a975c0f55e57f97e73bb90041676b","verbosity":0 }'
   *
   * @apiParam {String} blockhash Block hash (required)
   * @apiParam {Number} verbosity Default 1 (optional)
   *
   */
  async getBlock (req, res, next) {
    try {
      // Validate input parameter
      const blockhash = req.body.blockhash
      let verbosity = req.body.verbosity

      // Default to a value of 1 if another verbosity level is not defined.
      if (!verbosity && verbosity !== 0) verbosity = 1

      if (!blockhash || blockhash === '') {
        res.status(400)
        return res.json({ error: 'blockhash can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getblock'
      options.data.method = 'getblock'
      options.data.params = [blockhash, verbosity]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.js/getBlock()', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockchain/getBlockHash/ Get block hash
   * @apiName getBlockHash
   * @apiGroup Blockchain
   * @apiDescription Returns the hash of a block, given its block height.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/blockchain/getBlockHash/544444" -H "accept: application/json"
   *
   * @apiParam {String} height Block height (required)
   *
   *
   */
  async getBlockHash (req, res, next) {
    try {
      // Validate input parameter
      const height = req.params.height
      if (!height || height === '') {
        res.status(400)
        return res.json({ error: 'height can not be empty' })
      }

      // Axios options
      const options = _this.routeUtils.getAxiosOptions()

      options.data.id = 'getblockhash'
      options.data.method = 'getblockhash'
      options.data.params = [parseInt(height)]

      const response = await _this.axios.request(options)

      return res.json(response.data.result)
    } catch (err) {
      // Write out error to error log.
      // logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
      wlogger.error('Error in blockchain.js/getBlockHash()', err)

      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Blockchain
