/*
  TODO
  - Add blockhash functionality back into getTxOutProof
*/

"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")

const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// Define routes.
router.get("/", root)
router.get("/getBestBlockHash", getBestBlockHash)
// Dev Note: getBlock/:hash ommited because its the same as block/detailsByHash
//router.get("/getBlock/:hash", getBlock)
router.get("/getBlockchainInfo", getBlockchainInfo)
router.get("/getBlockCount", getBlockCount)
router.get("/getBlockHeader/:hash", getBlockHeaderSingle)
router.post("/getBlockHeader", getBlockHeaderBulk)
router.get("/getChainTips", getChainTips)
router.get("/getDifficulty", getDifficulty)
router.get("/getMempoolEntry/:txid", getMempoolEntrySingle)
router.post("/getMempoolEntry", getMempoolEntryBulk)
router.get("/getMempoolInfo", getMempoolInfo)
router.get("/getRawMempool", getRawMempool)
router.get("/getTxOut/:txid/:n", getTxOut)
router.get("/getTxOutProof/:txid", getTxOutProofSingle)
router.post("/getTxOutProof", getTxOutProofBulk)
router.get("/verifyTxOutProof/:proof", verifyTxOutProofSingle)
router.post("/verifyTxOutProof", verifyTxOutProofBulk)

function root(req, res, next) {
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
 * curl -X GET "http://localhost:3000/v3/blockchain/getBestBlockHash" -H "accept: application/json"
 *
 * @apiSuccess {String}   bestBlockHash           000000000000000002bc884334336d99c9a9c616670a9244c6a8c1fc35aa91a1
 */
async function getBestBlockHash(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getbestblockhash"
    requestConfig.data.method = "getbestblockhash"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)
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

/**
 * @api {get} /blockchain/getBlockchainInfo Get blockchain info
 * @apiName GetBlockchainInfo
 * @apiGroup Blockchain
 * @apiDescription Returns an object containing various state info regarding blockchain processing.
 *
 * @apiExample Example usage:
 * curl -X GET "http://localhost:3000/v3/blockchain/getBlockchainInfo" -H "accept: application/json"
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
async function getBlockchainInfo(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockchaininfo"
    requestConfig.data.method = "getblockchaininfo"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getBlockchainInfo().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {get} /blockchain/getBlockCount Get Block Count
 * @apiName GetBlockCount
 * @apiGroup Blockchain
 * @apiDescription Returns the number of blocks in the longest blockchain.
 *
 * @apiExample Example usage:
 * curl -X GET "http://localhost:3000/v3/blockchain/getBlockCount" -H "accept: application/json"
 *
 * @apiSuccess {Number} bestBlockCount  587665
 */
async function getBlockCount(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockcount"
    requestConfig.data.method = "getblockcount"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)
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
    wlogger.error(`Error in blockchain.ts/getBlockCount().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
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
 * curl -X GET "http://localhost:3000/v3/blockchain/getBlockHeader/000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201?verbose=true" -H "accept: application/json"
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
async function getBlockHeaderSingle(req, res, next) {
  try {
    let verbose = false
    if (req.query.verbose && req.query.verbose.toString() === "true")
      verbose = true

    const hash = req.params.hash
    if (!hash || hash === "") {
      res.status(400)
      return res.json({ error: "hash can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockheader"
    requestConfig.data.method = "getblockheader"
    requestConfig.data.params = [hash, verbose]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getBlockHeaderSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
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
 * curl -X POST "https://rest.bitcoin.com/v3/blockchain/getBlockHeader" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"hashes\":[\"000000000000000005e14d3f9fdfb70745308706615cfa9edca4f4558332b201\",\"00000000000000000568f0a96bf4348847bc84e455cbfec389f27311037a20f3\"],\"verbose\":true}"
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
async function getBlockHeaderBulk(req, res, next) {
  try {
    const hashes = req.body.hashes
    const verbose = req.body.verbose ? req.body.verbose : false

    if (!Array.isArray(hashes)) {
      res.status(400)
      return res.json({
        error: "hashes needs to be an array. Use GET for single hash."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, hashes)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(
      `Executing blockchain/getBlockHeaderBulk with these hashes: `,
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

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    // Loop through each hash and creates an array of requests to call in parallel
    const promises = hashes.map(async hash => {
      requestConfig.data.id = "getblockheader"
      requestConfig.data.method = "getblockheader"
      requestConfig.data.params = [hash, verbose]

      return await BitboxHTTP(requestConfig)
    })

    const axiosResult = await axios.all(promises)

    // Extract the data component from the axios response.
    const result = axiosResult.map(x => x.data.result)

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in blockchain.ts/getBlockHeaderBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getChainTips(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getchaintips"
    requestConfig.data.method = "getchaintips"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)
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
    wlogger.error(`Error in blockchain.ts/getChainTips().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Get the current difficulty value, used to regulate mining power on the network.
async function getDifficulty(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getdifficulty"
    requestConfig.data.method = "getdifficulty"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getDifficulty().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Returns mempool data for given transaction. TXID must be in mempool (unconfirmed)
async function getMempoolEntrySingle(req, res, next) {
  try {
    // Validate input parameter
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getmempoolentry"
    requestConfig.data.method = "getmempoolentry"
    requestConfig.data.params = [txid]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getMempoolEntrySingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getMempoolEntryBulk(req, res, next) {
  try {
    const txids = req.body.txids

    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({
        error: "txids needs to be an array. Use GET for single txid."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(
      `Executing blockchain/getMempoolEntry with these txids: `,
      txids
    )

    // Validate each element in the array
    for (let i = 0; i < txids.length; i++) {
      const txid = txids[i]

      if (txid.length !== 64) {
        res.status(400)
        return res.json({ error: "This is not a txid" })
      }
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    // Loop through each txid and creates an array of requests to call in parallel
    const promises = txids.map(async txid => {
      requestConfig.data.id = "getmempoolentry"
      requestConfig.data.method = "getmempoolentry"
      requestConfig.data.params = [txid]

      return await BitboxHTTP(requestConfig)
    })

    const axiosResult = await axios.all(promises)

    // Extract the data component from the axios response.
    const result = axiosResult.map(x => x.data.result)

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in blockchain.ts/getMempoolEntryBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getMempoolInfo(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getmempoolinfo"
    requestConfig.data.method = "getmempoolinfo"
    requestConfig.data.params = []

    const response = await BitboxHTTP(requestConfig)
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
    wlogger.error(`Error in blockchain.ts/getMempoolInfo().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getRawMempool(req, res, next) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    requestConfig.data.id = "getrawmempool"
    requestConfig.data.method = "getrawmempool"
    requestConfig.data.params = [verbose]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getRawMempool().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Returns details about an unspent transaction output.
async function getTxOut(req, res, next) {
  try {
    // Validate input parameter
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    let n = req.params.n
    if (n === undefined || n === "") {
      res.status(400)
      return res.json({ error: "n can not be empty" })
    }
    n = parseInt(n)

    let include_mempool = false
    if (req.query.include_mempool && req.query.include_mempool === "true")
      include_mempool = true

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "gettxout"
    requestConfig.data.method = "gettxout"
    requestConfig.data.params = [txid, n, include_mempool]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getTxOut().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Returns a hex-encoded proof that 'txid' was included in a block.
async function getTxOutProofSingle(req, res, next) {
  try {
    // Validate input parameter
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "gettxoutproof"
    requestConfig.data.method = "gettxoutproof"
    requestConfig.data.params = [[txid]]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/getTxOutProofSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Returns a hex-encoded proof that 'txid' was included in a block.
async function getTxOutProofBulk(req, res, next) {
  try {
    const txids = req.body.txids

    // Reject if txids is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({
        error: "txids needs to be an array. Use GET for single txid."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

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
      `Executing blockchain/getTxOutProof with these txids: `,
      txids
    )

    // Loop through each txid and creates an array of requests to call in parallel
    const promises = txids.map(async txid => {
      requestConfig.data.id = "gettxoutproof"
      requestConfig.data.method = "gettxoutproof"
      requestConfig.data.params = [[txid]]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel promisses to resolve.
    const axiosResult = await axios.all(promises)

    // Extract the data component from the axios response.
    const result = axiosResult.map(x => x.data.result)

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in blockchain.ts/getTxOutProofBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/*
//
// router.get('/preciousBlock/:hash', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"preciousblock",
//       method: "preciousblock",
//       params: [
//         req.params.hash
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(JSON.stringify(response.data.result));
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.post('/pruneBlockchain/:height', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"pruneblockchain",
//       method: "pruneblockchain",
//       params: [
//         req.params.height
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
//
// router.get('/verifyChain', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"verifychain",
//       method: "verifychain"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
*/

async function verifyTxOutProofSingle(req, res, next) {
  try {
    // Validate input parameter
    const proof = req.params.proof
    if (!proof || proof === "") {
      res.status(400)
      return res.json({ error: "proof can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "verifytxoutproof"
    requestConfig.data.method = "verifytxoutproof"
    requestConfig.data.params = [req.params.proof]

    const response = await BitboxHTTP(requestConfig)

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
    wlogger.error(`Error in blockchain.ts/verifyTxOutProofSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function verifyTxOutProofBulk(req, res, next) {
  try {
    const proofs = req.body.proofs

    // Reject if proofs is not an array.
    if (!Array.isArray(proofs)) {
      res.status(400)
      return res.json({
        error: "proofs needs to be an array. Use GET for single proof."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, proofs)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    // Validate each element in the array.
    for (let i = 0; i < proofs.length; i++) {
      const proof = proofs[i]

      if (!proof || proof === "") {
        res.status(400)
        return res.json({ error: `proof can not be empty: ${proof}` })
      }
    }

    wlogger.debug(
      `Executing blockchain/verifyTxOutProof with these proofs: `,
      proofs
    )

    // Loop through each proof and creates an array of requests to call in parallel
    const promises = proofs.map(async proof => {
      requestConfig.data.id = "verifytxoutproof"
      requestConfig.data.method = "verifytxoutproof"
      requestConfig.data.params = [proof]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel promisses to resolve.
    const axiosResult = await axios.all(promises)

    // Extract the data component from the axios response.
    const result = axiosResult.map(x => x.data.result[0])

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in blockchain.ts/verifyTxOutProofBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    getBestBlockHash,
    //getBlock,
    getBlockchainInfo,
    getBlockCount,
    getBlockHeaderSingle,
    getBlockHeaderBulk,
    getChainTips,
    getDifficulty,
    getMempoolInfo,
    getRawMempool,
    getMempoolEntrySingle,
    getMempoolEntryBulk,
    getTxOut,
    getTxOutProofSingle,
    getTxOutProofBulk,
    verifyTxOutProofSingle,
    verifyTxOutProofBulk
  }
}
