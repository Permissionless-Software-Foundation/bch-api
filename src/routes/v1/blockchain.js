"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const config = {
  blockchainRateLimit1: undefined,
  blockchainRateLimit2: undefined,
  blockchainRateLimit3: undefined,
  blockchainRateLimit4: undefined,
  blockchainRateLimit5: undefined,
  blockchainRateLimit6: undefined,
  blockchainRateLimit7: undefined,
  blockchainRateLimit8: undefined,
  blockchainRateLimit9: undefined,
  blockchainRateLimit10: undefined,
  blockchainRateLimit11: undefined,
  blockchainRateLimit12: undefined,
  blockchainRateLimit13: undefined,
  blockchainRateLimit14: undefined,
  blockchainRateLimit15: undefined,
  blockchainRateLimit16: undefined,
  blockchainRateLimit17: undefined
}

let i = 1
while (i < 18) {
  config[`blockchainRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: function(req, res /*next*/) {
      res.format({
        json: function() {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

const requestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

router.get("/", config.blockchainRateLimit1, async (req, res, next) => {
  res.json({ status: "blockchain" })
})

router.get(
  "/getBestBlockHash",
  config.blockchainRateLimit2,
  async (req, res, next) => {
    requestConfig.data.id = "getbestblockhash"
    requestConfig.data.method = "getbestblockhash"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getBlock/:hash",
  config.blockchainRateLimit3,
  async (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    let showTxs = true
    if (req.query.txs && req.query.txs === "false") showTxs = false

    requestConfig.data.id = "getblock"
    requestConfig.data.method = "getblock"
    requestConfig.data.params = [req.params.hash, verbose]

    try {
      const response = await BitboxHTTP(requestConfig)
      if (!showTxs) delete response.data.result.tx
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getBlockchainInfo",
  config.blockchainRateLimit4,
  async (req, res, next) => {
    requestConfig.data.id = "getblockchaininfo"
    requestConfig.data.method = "getblockchaininfo"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getBlockCount",
  config.blockchainRateLimit5,
  async (req, res, next) => {
    requestConfig.data.id = "getblockcount"
    requestConfig.data.method = "getblockcount"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getBlockHash/:height",
  config.blockchainRateLimit6,
  async (req, res, next) => {
    try {
      let heights = JSON.parse(req.params.height)
      if (heights.length > 20) {
        res.json({
          error: "Array too large. Max 20 heights"
        })
      }
      const result = []
      heights = heights.map(height =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getblockhash",
            method: "getblockhash",
            params: [height]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(heights).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getblockhash",
          method: "getblockhash",
          params: [parseInt(req.params.height)]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getBlockHeader/:hash",
  config.blockchainRateLimit7,
  async (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    try {
      let hashes = JSON.parse(req.params.hash)
      if (hashes.length > 20) {
        res.json({
          error: "Array too large. Max 20 hashes"
        })
      }
      const result = []
      hashes = hashes.map(hash =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getblockheader",
            method: "getblockheader",
            params: [hash, verbose]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(hashes).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getblockheader",
          method: "getblockheader",
          params: [req.params.hash, verbose]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getChainTips",
  config.blockchainRateLimit8,
  async (req, res, next) => {
    requestConfig.data.id = "getchaintips"
    requestConfig.data.method = "getchaintips"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getDifficulty",
  config.blockchainRateLimit9,
  async (req, res, next) => {
    requestConfig.data.id = "getdifficulty"
    requestConfig.data.method = "getdifficulty"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getMempoolAncestors/:txid",
  config.blockchainRateLimit10,
  async (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    try {
      let txids = JSON.parse(req.params.txid)
      if (txids.length > 20) {
        res.json({
          error: "Array too large. Max 20 txids"
        })
      }
      const result = []
      txids = txids.map(txid =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getmempoolancestors",
            method: "getmempoolancestors",
            params: [txid, verbose]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(txids).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getmempoolancestors",
          method: "getmempoolancestors",
          params: [req.params.txid, verbose]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getMempoolDescendants/:txid",
  config.blockchainRateLimit11,
  async (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    try {
      let txids = JSON.parse(req.params.txid)
      if (txids.length > 20) {
        res.json({
          error: "Array too large. Max 20 txids"
        })
      }
      const result = []
      txids = txids.map(txid =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getmempooldescendants",
            method: "getmempooldescendants",
            params: [txid, verbose]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(txids).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getmempooldescendants",
          method: "getmempooldescendants",
          params: [req.params.txid, verbose]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getMempoolEntry/:txid",
  config.blockchainRateLimit12,
  async (req, res, next) => {
    try {
      let txids = JSON.parse(req.params.txid)
      if (txids.length > 20) {
        res.json({
          error: "Array too large. Max 20 txids"
        })
      }
      const result = []
      txids = txids.map(txid =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getmempoolentry",
            method: "getmempoolentry",
            params: [txid]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(txids).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getmempoolentry",
          method: "getmempoolentry",
          params: [req.params.txid]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getMempoolInfo",
  config.blockchainRateLimit13,
  async (req, res, next) => {
    requestConfig.data.id = "getmempoolinfo"
    requestConfig.data.method = "getmempoolinfo"
    requestConfig.data.params = []

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getRawMempool",
  config.blockchainRateLimit14,
  async (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === true) verbose = true

    requestConfig.data.id = "getrawmempool"
    requestConfig.data.method = "getrawmempool"
    requestConfig.data.params = [verbose]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getTxOut/:txid/:n",
  config.blockchainRateLimit15,
  async (req, res, next) => {
    let include_mempool = false
    if (req.query.include_mempool && req.query.include_mempool === "true")
      include_mempool = true

    requestConfig.data.id = "gettxout"
    requestConfig.data.method = "gettxout"
    requestConfig.data.params = [
      req.params.txid,
      parseInt(req.params.n),
      include_mempool
    ]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.get(
  "/getTxOutProof/:txids",
  config.blockchainRateLimit16,
  async (req, res, next) => {
    requestConfig.data.id = "gettxoutproof"
    requestConfig.data.method = "gettxoutproof"
    requestConfig.data.params = [req.params.txids]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)
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

router.get(
  "/verifyTxOutProof/:proof",
  config.blockchainRateLimit17,
  async (req, res, next) => {
    requestConfig.data.id = "verifytxoutproof"
    requestConfig.data.method = "verifytxoutproof"
    requestConfig.data.params = [req.params.proof]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

module.exports = router
