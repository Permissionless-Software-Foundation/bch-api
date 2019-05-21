/*
  TODO
  - Add blockhash functionality back into getTxOutProof
*/

"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const routeUtils = require("./route-utils")
const logger = require("./logging.js")
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

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "blockchain" })
}

// Returns the hash of the best (tip) block in the longest block chain.
async function getBestBlockHash(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getBlockchainInfo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getBlockCount(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getBlockHeaderSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getBlockHeaderBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let hashes = req.body.hashes
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

    logger.debug(
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
    const promises = hashes.map(async (hash: any) => {
      requestConfig.data.id = "getblockheader"
      requestConfig.data.method = "getblockheader"
      requestConfig.data.params = [hash, verbose]

      return await BitboxHTTP(requestConfig)
    })

    const axiosResult: Array<any> = await axios.all(promises)

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

async function getChainTips(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
async function getDifficulty(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
async function getMempoolEntrySingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getMempoolEntryBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let txids = req.body.txids

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

    logger.debug(
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
    const promises = txids.map(async (txid: any) => {
      requestConfig.data.id = "getmempoolentry"
      requestConfig.data.method = "getmempoolentry"
      requestConfig.data.params = [txid]

      return await BitboxHTTP(requestConfig)
    })

    const axiosResult: Array<any> = await axios.all(promises)

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

async function getMempoolInfo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function getRawMempool(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
async function getTxOut(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
async function getTxOutProofSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
async function getTxOutProofBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let txids = req.body.txids

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

    logger.debug(`Executing blockchain/getTxOutProof with these txids: `, txids)

    // Loop through each txid and creates an array of requests to call in parallel
    const promises = txids.map(async (txid: any) => {
      requestConfig.data.id = "gettxoutproof"
      requestConfig.data.method = "gettxoutproof"
      requestConfig.data.params = [[txid]]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel promisses to resolve.
    const axiosResult: Array<any> = await axios.all(promises)

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

async function verifyTxOutProofSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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

async function verifyTxOutProofBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let proofs = req.body.proofs

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

    logger.debug(
      `Executing blockchain/verifyTxOutProof with these proofs: `,
      proofs
    )

    // Loop through each proof and creates an array of requests to call in parallel
    const promises = proofs.map(async (proof: any) => {
      requestConfig.data.id = "verifytxoutproof"
      requestConfig.data.method = "verifytxoutproof"
      requestConfig.data.params = [proof]

      return await BitboxHTTP(requestConfig)
    })

    // Wait for all parallel promisses to resolve.
    const axiosResult: Array<any> = await axios.all(promises)

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
