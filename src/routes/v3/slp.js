"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const BigNumber = require("bignumber.js")

const routeUtils = require("./route-utils")
const strftime = require("strftime")
const wlogger = require("../../util/winston-logging")

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 5 }

// Setup JSON RPC
const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

// Determine the Access password for a private instance of SLPDB.
// https://gist.github.com/christroutner/fc717ca704dec3dded8b52fae387eab2
const SLPDB_PASS = process.env.SLPDB_PASS ? process.env.SLPDB_PASS : "BITBOX"

// const transactions = require("./insight/transaction")
const rawtransactions = require("./full-node/rawtransactions")

// Setup REST and TREST URLs used by slpjs
// Dev note: this allows for unit tests to mock the URL.
if (!process.env.REST_URL) process.env.REST_URL = `https://rest.bitcoin.com/v2/`
if (!process.env.TREST_URL)
  process.env.TREST_URL = `https://trest.bitcoin.com/v2/`

router.get("/", root)
router.get("/list", list)
router.get("/list/:tokenId", listSingleToken)
router.post("/list", listBulkToken)
router.get("/balancesForAddress/:address", balancesForAddress)
router.post("/balancesForAddress", balancesForAddressBulk)
router.get("/balancesForToken/:tokenId", balancesForTokenSingle)
router.get("/balance/:address/:tokenId", balancesForAddressByTokenID)
router.get("/convert/:address", convertAddressSingle)
router.post("/convert", convertAddressBulk)
router.post("/validateTxid", validateBulk)
router.get("/validateTxid/:txid", validateSingle)
router.get("/txDetails/:txid", txDetails)
router.get("/tokenStats/:tokenId", tokenStats)
router.get("/transactions/:tokenId/:address", txsTokenIdAddressSingle)

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

function formatTokenOutput(token) {
  token.tokenDetails.id = token.tokenDetails.tokenIdHex
  delete token.tokenDetails.tokenIdHex
  token.tokenDetails.documentHash = token.tokenDetails.documentSha256Hex
  delete token.tokenDetails.documentSha256Hex
  token.tokenDetails.initialTokenQty = parseFloat(
    token.tokenDetails.genesisOrMintQuantity
  )
  delete token.tokenDetails.genesisOrMintQuantity
  delete token.tokenDetails.transactionType
  delete token.tokenDetails.batonVout
  delete token.tokenDetails.sendOutputs

  token.tokenDetails.blockCreated = token.tokenStats.block_created
  token.tokenDetails.blockLastActiveSend =
    token.tokenStats.block_last_active_send
  token.tokenDetails.blockLastActiveMint =
    token.tokenStats.block_last_active_mint
  token.tokenDetails.txnsSinceGenesis =
    token.tokenStats.qty_valid_txns_since_genesis
  token.tokenDetails.validAddresses = token.tokenStats.qty_valid_token_addresses
  token.tokenDetails.totalMinted = parseFloat(token.tokenStats.qty_token_minted)
  token.tokenDetails.totalBurned = parseFloat(token.tokenStats.qty_token_burned)
  token.tokenDetails.circulatingSupply = parseFloat(
    token.tokenStats.qty_token_circulating_supply
  )
  token.tokenDetails.mintingBatonStatus = token.tokenStats.minting_baton_status

  delete token.tokenStats.block_last_active_send
  delete token.tokenStats.block_last_active_mint
  delete token.tokenStats.qty_valid_txns_since_genesis
  delete token.tokenStats.qty_valid_token_addresses
  return token
}

function root(req, res, next) {
  return res.json({ status: "slp" })
}

/**
 * @api {get} /slp/list  List all SLP tokens.
 * @apiName List all SLP tokens.
 * @apiGroup SLP
 * @apiDescription Returns list all SLP tokens.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/list" -H "accept:application/json"
 *
 *
 */
async function list(req, res, next) {
  try {
    const query = {
      v: 3,
      q: {
        db: ["t"],
        find: {
          $query: {}
        },
        project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
        sort: { "tokenStats.block_created": -1 },
        limit: 10000
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from SLPDB.
    const tokenRes = await axios.get(url)

    const formattedTokens = []

    if (tokenRes.data.t.length) {
      tokenRes.data.t.forEach(token => {
        token = formatTokenOutput(token)
        formattedTokens.push(token.tokenDetails)
      })
    }

    res.status(200)
    return res.json(formattedTokens)
  } catch (err) {
    wlogger.error(`Error in slp.ts/list().`, err)

    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list: ${err.message}` })
  }
}

/**
 * @api {get} /slp/list/{tokenId}  List single SLP token by id.
 * @apiName List single SLP token by id.
 * @apiGroup SLP
 * @apiDescription Returns the list single SLP token by id.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/list/259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1" -H "accept:application/json"
 *
 *
 */
async function listSingleToken(req, res, next) {
  try {
    const tokenId = req.params.tokenId

    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    const t = await lookupToken(tokenId)

    res.status(200)
    return res.json(t)
  } catch (err) {
    wlogger.error(`Error in slp.ts/listSingleToken().`, err)

    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
  }
}

/**
 * @api {post} /slp/list/  List Bulk SLP token .
 * @apiName List Bulk SLP token.
 * @apiGroup SLP
 * @apiDescription Returns the list bulk SLP token by id.
 *
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/slp/list" -H "accept:application/json" -H "Content-Type: application/json" -d '{"tokenIds":["7380843cd1089a1a01783f86af37734dc99667a1cdc577391b5f6ea42fc1bfb4","9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0"]}'
 *
 *
 */
async function listBulkToken(req, res, next) {
  try {
    const tokenIds = req.body.tokenIds

    // Reject if tokenIds is not an array.
    if (!Array.isArray(tokenIds)) {
      res.status(400)
      return res.json({
        error: "tokenIds needs to be an array. Use GET for single tokenId."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, tokenIds)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    const query = {
      v: 3,
      q: {
        db: ["t"],
        find: {
          "tokenDetails.tokenIdHex": {
            $in: tokenIds
          }
        },
        project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
        sort: { "tokenStats.block_created": -1 },
        limit: 10000
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)

    const formattedTokens = []
    const txids = []

    if (tokenRes.data.t.length) {
      tokenRes.data.t.forEach(token => {
        txids.push(token.tokenDetails.tokenIdHex)
        token = formatTokenOutput(token)
        formattedTokens.push(token.tokenDetails)
      })
    }

    tokenIds.forEach(tokenId => {
      if (!txids.includes(tokenId)) {
        formattedTokens.push({
          id: tokenId,
          valid: false
        })
      }
    })

    res.status(200)
    return res.json(formattedTokens)
  } catch (err) {
    wlogger.error(`Error in slp.ts/listBulkToken().`, err)

    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
  }
}

async function lookupToken(tokenId) {
  try {
    const query = {
      v: 3,
      q: {
        db: ["t"],
        find: {
          $query: {
            "tokenDetails.tokenIdHex": tokenId
          }
        },
        project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
        limit: 1000
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // console.log(`url: ${url}`)

    const tokenRes = await axios.get(url)
    //console.log(`tokenRes.data: ${util.inspect(tokenRes.data,null,2)}`)
    //console.log(
    //  `tokenRes.data.t[0]: ${util.inspect(tokenRes.data.t[0], null, 2)}`
    //)

    const formattedTokens = []

    if (tokenRes.data.t.length) {
      tokenRes.data.t.forEach(token => {
        token = formatTokenOutput(token)
        formattedTokens.push(token.tokenDetails)
      })
    }

    let t
    formattedTokens.forEach(token => {
      if (token.id === tokenId) t = token
    })

    // If token could not be found.
    if (t === undefined) {
      t = {
        id: "not found"
      }
    }

    return t
  } catch (err) {
    wlogger.error(`Error in slp.ts/lookupToken().`, err)
    //console.log(`Error in slp.ts/lookupToken()`)
    throw err
  }
}

/**
 * @api {get} /slp/balancesForAddress/{address}  List  SLP  balance for address.
 * @apiName List SLP  balance for address.
 * @apiGroup SLP
 * @apiDescription Returns List  SLP  balance for address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/balancesForAddress/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
 *
 *
 */
// Retrieve token balances for all tokens for a single address.
async function balancesForAddress(req, res, next) {
  try {
    // Validate the input data.
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      const cash = bchjs.SLP.Address.toCashAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const cashAddr = bchjs.SLP.Address.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const query = {
      v: 3,
      q: {
        db: ["a"],
        find: {
          address: bchjs.SLP.Address.toSLPAddress(address),
          token_balance: { $gte: 0 }
        },
        limit: 10000
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)

    const tokenIds = []
    if (tokenRes.data.a.length > 0) {
      tokenRes.data.a = tokenRes.data.a.map(token => {
        token.tokenId = token.tokenDetails.tokenIdHex
        tokenIds.push(token.tokenId)
        token.balance = parseFloat(token.token_balance)
        token.slpAddress = token.address
        delete token.tokenDetails
        delete token.satoshis_balance
        delete token.token_balance
        delete token._id
        delete token.address
        return token
      })

      const promises = tokenIds.map(async tokenId => {
        try {
          const query2 = {
            v: 3,
            q: {
              db: ["t"],
              find: {
                $query: {
                  "tokenDetails.tokenIdHex": tokenId
                }
              },
              project: {
                "tokenDetails.decimals": 1,
                "tokenDetails.tokenIdHex": 1,
                _id: 0
              },
              limit: 1000
            }
          }

          const s2 = JSON.stringify(query2)
          const b642 = Buffer.from(s2).toString("base64")
          const url2 = `${process.env.SLPDB_URL}q/${b642}`

          const tokenRes2 = await axios.get(url2)
          return tokenRes2.data
        } catch (err) {
          throw err
        }
      })

      const details = await axios.all(promises)
      tokenRes.data.a = tokenRes.data.a.map(token => {
        details.forEach(detail => {
          if (detail.t[0].tokenDetails.tokenIdHex === token.tokenId)
            token.decimalCount = detail.t[0].tokenDetails.decimals
        })
        return token
      })

      return res.json(tokenRes.data.a)
    }
    return res.json("No balance for this address")
  } catch (err) {
    wlogger.error(`Error in slp.ts/balancesForAddress().`, err)

    // Decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({
      error: `Error in /address/:address: ${err.message}`
    })
  }
}

/**
 * @api {post} /slp/balancesForAddress  List SLP balances for an array of addresses.
 * @apiName List SLP balances for an array of addresses.
 * @apiGroup SLP
 * @apiDescription Returns SLP balances for an array of addresses.
 *
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/slp/balancesForAddress" -d "{\"addresses\":[\"simpleledger:qqss4zp80hn6szsa4jg2s9fupe7g5tcg5ucdyl3r57\"]}" -H "accept:application/json"
 *
 *
 */
async function balancesForAddressBulk(req, res, next) {
  try {
    const addresses = req.body.addresses

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(
      `Executing slp/balancesForAddresss with these addresses: `,
      addresses
    )

    // Loop through each address and do error checking.
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]

      // Validate the input data.
      if (!address || address === "") {
        res.status(400)
        return res.json({ error: "address can not be empty" })
      }

      // Ensure the input is a valid BCH address.
      try {
        bchjs.SLP.Address.toCashAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const cashAddr = bchjs.SLP.Address.toCashAddress(address)
      const networkIsValid = routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Collect an array of promises, one for each request to slpserve.
    // This is a nested array of promises.
    const balancesPromises = addresses.map(async address => {
      try {
        const query = {
          v: 3,
          q: {
            db: ["a"],
            find: {
              address: bchjs.SLP.Address.toSLPAddress(address),
              token_balance: { $gte: 0 }
            },
            limit: 10000
          }
        }

        const s = JSON.stringify(query)
        const b64 = Buffer.from(s).toString("base64")
        const url = `${process.env.SLPDB_URL}q/${b64}`

        const tokenRes = await axios.get(url)

        const tokenIds = []

        if (tokenRes.data.a.length > 0) {
          tokenRes.data.a = tokenRes.data.a.map(token => {
            token.tokenId = token.tokenDetails.tokenIdHex
            tokenIds.push(token.tokenId)
            token.balance = parseFloat(token.token_balance)
            token.balanceString = token.token_balance
            token.slpAddress = token.address
            delete token.tokenDetails
            delete token.satoshis_balance
            delete token.token_balance
            delete token._id
            delete token.address
            return token
          })
        }

        // Collect another array of promises.
        const promises = tokenIds.map(async tokenId => {
          try {
            const query2 = {
              v: 3,
              q: {
                db: ["t"],
                find: {
                  $query: {
                    "tokenDetails.tokenIdHex": tokenId
                  }
                },
                project: {
                  "tokenDetails.decimals": 1,
                  "tokenDetails.tokenIdHex": 1,
                  _id: 0
                },
                limit: 1000
              }
            }

            const s2 = JSON.stringify(query2)
            const b642 = Buffer.from(s2).toString("base64")
            const url2 = `${process.env.SLPDB_URL}q/${b642}`

            const tokenRes2 = await axios.get(url2)
            return tokenRes2.data
          } catch (err) {
            throw err
          }
        })

        // Wait for all the promises to resolve.
        const details = await axios.all(promises)

        tokenRes.data.a = tokenRes.data.a.map(token => {
          details.forEach(detail => {
            if (detail.t[0].tokenDetails.tokenIdHex === token.tokenId)
              token.decimalCount = detail.t[0].tokenDetails.decimals
          })
          return token
        })

        return tokenRes.data.a
      } catch (err) {
        throw err
      }
    })

    // Wait for all the promises to resolve.
    const axiosResult = await axios.all(balancesPromises)

    return res.json(axiosResult)
  } catch (err) {
    wlogger.error(`Error in slp.js/balancesForAddressBulk().`, err)

    // Decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({
      error: `Error in POST balancesForAddress: ${err.message}`
    })
  }
}

/**
 * @api {get} /slp/balancesForToken/{TokenId}  List SLP addresses and balances for tokenId.
 * @apiName List SLP addresses and balances for tokenId.
 * @apiGroup SLP
 * @apiDescription Returns List SLP addresses and balances for tokenId.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/balancesForToken/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
 *
 *
 */
// Retrieve token balances for all addresses by single tokenId.
async function balancesForTokenSingle(req, res, next) {
  try {
    // Validate the input data.
    const tokenId = req.params.tokenId
    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    const query = {
      v: 3,
      q: {
        find: {
          "tokenDetails.tokenIdHex": tokenId,
          token_balance: { $gte: 0 }
        },
        limit: 10000,
        project: { address: 1, satoshis_balance: 1, token_balance: 1, _id: 0 }
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from SLPDB.
    const tokenRes = await axios.get(url)
    const resBalances = tokenRes.data.a.map((addy, index) => {
      delete addy.satoshis_balance
      addy.tokenBalance = parseFloat(addy.token_balance)
      addy.slpAddress = addy.address
      addy.tokenId = tokenId
      delete addy.address
      delete addy.token_balance
      return addy
    })
    return res.json(resBalances)
  } catch (err) {
    wlogger.error(`Error in slp.ts/balancesForTokenSingle().`, err)

    // Decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({
      error: `Error in /balancesForToken/:tokenId: ${err.message}`
    })
  }
}

/**
 * @api {get} /slp/balance/{address}/{TokenId}  List single slp token balance for address.
 * @apiName List single slp token balance for address.
 * @apiGroup SLP
 * @apiDescription Returns List single slp token balance for address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/balance/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m/1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125" -H "accept:application/json"
 *
 *
 */
// Retrieve token balances for a single token class, for a single address.
async function balancesForAddressByTokenID(req, res, next) {
  try {
    // Validate input data.
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const tokenId = req.params.tokenId
    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      const cash = utils.toCashAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const cashAddr = utils.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Convert input to an simpleledger: address.
    const slpAddr = utils.toSlpAddress(req.params.address)

    const query = {
      v: 3,
      q: {
        db: ["a"],
        find: {
          address: slpAddr,
          token_balance: { $gte: 0 }
        },
        limit: 10
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from SLPDB.
    const tokenRes = await axios.get(url)
    let resVal
    res.status(200)
    if (tokenRes.data.a.length > 0) {
      tokenRes.data.a.forEach(async token => {
        if (token.tokenDetails.tokenIdHex === tokenId) {
          resVal = {
            tokenId: tokenRes.data.a[0].tokenDetails.tokenIdHex,
            balance: parseFloat(tokenRes.data.a[0].token_balance)
          }
        } else {
          resVal = {
            tokenId: tokenId,
            balance: 0
          }
        }
      })
    } else {
      resVal = {
        tokenId: tokenId,
        balance: 0
      }
    }
    return res.json(resVal)
  } catch (err) {
    wlogger.error(`Error in slp.ts/balancesForAddressByTokenID().`, err)

    // Decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({
      error: `Error in /balance/:address/:tokenId: ${err.message}`
    })
  }
}

/**
 * @api {get} /slp/convert/{address}  Convert address to slpAddr, cashAddr and legacy.
 * @apiName Convert address to slpAddr, cashAddr and legacy.
 * @apiGroup SLP
 * @apiDescription Convert address to slpAddr, cashAddr and legacy.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/convert/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
 *
 *
 */
async function convertAddressSingle(req, res, next) {
  try {
    const address = req.params.address

    // Validate input
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const slpAddr = SLP.Address.toSLPAddress(address)

    const obj = {
      slpAddress: "",
      cashAddress: "",
      legacyAddress: ""
    }
    obj.slpAddress = slpAddr
    obj.cashAddress = SLP.Address.toCashAddress(slpAddr)
    obj.legacyAddress = SLP.Address.toLegacyAddress(obj.cashAddress)

    res.status(200)
    return res.json(obj)
  } catch (err) {
    wlogger.error(`Error in slp.ts/convertAddressSingle().`, err)

    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /address/convert/:address: ${err.message}`
    })
  }
}

/**
 * @api {post} /slp/convert/  Convert multiple addresses to cash, legacy and simpleledger format.
 * @apiName Convert multiple addresses to cash, legacy and simpleledger format.
 * @apiGroup SLP
 * @apiDescription Convert multiple addresses to cash, legacy and simpleledger format.
 *
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/slp/convert" -H "accept:application/json" -H "Content-Type: application/json" -d '{"addresses":["simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l"]}'
 *
 *
 */
async function convertAddressBulk(req, res, next) {
  const addresses = req.body.addresses

  // Reject if hashes is not an array.
  if (!Array.isArray(addresses)) {
    res.status(400)
    return res.json({
      error: "addresses needs to be an array. Use GET for single address."
    })
  }

  // Enforce array size rate limits
  if (!routeUtils.validateArraySize(req, addresses)) {
    res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
    return res.json({
      error: `Array too large.`
    })
  }

  // Convert each address in the array.
  const convertedAddresses = []
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]

    // Validate input
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const slpAddr = SLP.Address.toSLPAddress(address)

    const obj = {
      slpAddress: "",
      cashAddress: "",
      legacyAddress: ""
    }
    obj.slpAddress = slpAddr
    obj.cashAddress = SLP.Address.toCashAddress(slpAddr)
    obj.legacyAddress = SLP.Address.toLegacyAddress(obj.cashAddress)

    convertedAddresses.push(obj)
  }

  res.status(200)
  return res.json(convertedAddresses)
}

/**
 * @api {post} /slp/validateTxid/  Validate multiple SLP transactions by txid.
 * @apiName Validate multiple SLP transactions by txid.
 * @apiGroup SLP
 * @apiDescription Validate multiple SLP transactions by txid.
 *
 *
 * @apiExample Example usage:
 * curl -X POST "https://mainnet.bchjs.cash/v3/slp/validateTxid" -H "accept:application/json" -H "Content-Type: application/json" -d '{"txids":["f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a","fb0eeaa501a6e1acb721669c62a3f70741f48ae0fd7f4b8e1d72088785c51952"]}'
 *
 *
 */
async function validateBulk(req, res, next) {
  try {
    const txids = req.body.txids

    // Reject if txids is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids needs to be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(`Executing slp/validate with these txids: `, txids)

    const query = {
      v: 3,
      q: {
        db: ["c", "u"],
        find: {
          "tx.h": { $in: txids }
        },
        limit: 300,
        project: { "slp.valid": 1, "tx.h": 1, "slp.invalidReason": 1 }
      }
    }
    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    const options = generateCredentials()

    // Get data from SLPDB.
    const tokenRes = await axios.get(url, options)
    // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

    let formattedTokens = []

    // Combine the arrays. Why? Generally there is nothing in the u array.
    const concatArray = tokenRes.data.c.concat(tokenRes.data.u)

    const tokenIds = []
    if (concatArray.length > 0) {
      concatArray.forEach(token => {
        tokenIds.push(token.tx.h) // txid

        const validationResult = {
          txid: token.tx.h,
          valid: token.slp.valid
        }

        // If the txid is invalid, add the reason it's invalid.
        if (!validationResult.valid)
          validationResult.invalidReason = token.slp.invalidReason

        formattedTokens.push(validationResult)
      })

      // If a user-provided txid doesn't exist in the data, add it with
      // valid:false property.
      txids.forEach(txid => {
        if (!tokenIds.includes(txid)) {
          formattedTokens.push({
            txid: txid,
            valid: false
          })
        }
      })
    }

    // Catch a corner case of repeated txids. SLPDB will remove redundent TXIDs,
    // which will cause the output array to be smaller than the input array.
    if (txids.length > formattedTokens.length) {
      const newOutput = []
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]

        // Find the element that matches the current txid.
        const elem = formattedTokens.filter(x => x.txid === thisTxid)

        newOutput.push(elem[0])
      }

      // Replace the original output object with the new output object.
      formattedTokens = newOutput
    }

    res.status(200)
    return res.json(formattedTokens)
  } catch (err) {
    wlogger.error(`Error in slp.ts/validateBulk().`, err)

    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {get} /slp/validateTxid/{txid}  Validate single SLP transaction by txid.
 * @apiName Validate single SLP transaction by txid.
 * @apiGroup SLP
 * @apiDescription Validate single SLP transaction by txid.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/validateTxid/f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a" -H "accept:application/json"
 *
 *
 */
async function validateSingle(req, res, next) {
  try {
    const txid = req.params.txid

    // Validate input
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    wlogger.debug(`Executing slp/validate/:txid with this txid: `, txid)

    const query = {
      v: 3,
      q: {
        db: ["c", "u"],
        find: {
          "tx.h": txid
        },
        limit: 300,
        project: { "slp.valid": 1, "tx.h": 1, "slp.invalidReason": 1 }
      }
    }

    const options = generateCredentials()

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from SLPDB.
    const tokenRes = await axios.get(url, options)

    // Default return value.
    let result = {
      txid: txid,
      valid: false
    }

    // Build result.
    const concatArray = tokenRes.data.c.concat(tokenRes.data.u)
    if (concatArray.length > 0) {
      result = {
        txid: concatArray[0].tx.h,
        valid: concatArray[0].slp.valid
      }
      if (!result.valid) result.invalidReason = concatArray[0].slp.invalidReason
    }

    res.status(200)
    return res.json(tmp)
  } catch (err) {
    wlogger.error(`Error in slp.ts/validateSingle().`, err)

    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Returns a Boolean if the input TXID is a valid SLP TXID.
async function isValidSlpTxid(txid) {
  const isValid = await slpValidator.isValidSlpTxid(txid)
  return isValid
}

/**
 * @api {get} /slp/txDetails/{txid}  SLP transaction details.
 * @apiName SLP transaction details.
 * @apiGroup SLP
 * @apiDescription Transaction details on a token transfer.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/txDetails/8ab4ac5dea3f9024e3954ee5b61452955d659a34561f79ef62ac44e133d0980e" -H "accept:application/json"
 *
 *
 */
async function txDetails(req, res, next) {
  try {
    // Validate input parameter
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    if (txid.length !== 64) {
      res.status(400)
      return res.json({ error: "This is not a txid" })
    }

    const query = {
      v: 3,
      db: ["g"],
      q: {
        find: {
          "tx.h": txid
        },
        limit: 300
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    const options = generateCredentials()

    // Get token data from SLPDB
    const tokenRes = await axios.get(url, options)
    // console.log(`tokenRes: ${util.inspect(tokenRes)}`)

    if (tokenRes.data.c.length === 0) {
      res.status(404)
      return res.json({ error: "TXID not found" })
    }

    // Format the returned data to an object.
    const formatted = await formatToRestObject(tokenRes)
    // console.log(`formatted: ${JSON.stringify(formatted,null,2)}`)

    // Get information on the transaction from Insight API.
    // const retData = await transactions.transactionsFromInsight(txid)
    const retData = await rawtransactions.getRawTransactionsFromNode(txid, true)
    // console.log(`retData: ${JSON.stringify(retData, null, 2)}`)

    // Return both the tx data from Insight and the formatted token information.
    const response = {
      retData,
      ...formatted
    }

    res.status(200)
    return res.json(response)
  } catch (err) {
    wlogger.error(`Error in slp.ts/txDetails().`, err)

    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Handle corner case of mis-typted txid
    if (err.error && err.error.indexOf("Not found") > -1) {
      res.status(400)
      return res.json({ error: "TXID not found" })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 * @api {get} /slp/tokenStats/{tokenId}  List stats for a single slp token.
 * @apiName List stats for a single slp token.
 * @apiGroup SLP
 * @apiDescription Return list stats for a single slp token.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/tokenStats/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
 *
 *
 */
async function tokenStats(req, res, next) {
  const tokenId = req.params.tokenId
  if (!tokenId || tokenId === "") {
    res.status(400)
    return res.json({ error: "tokenId can not be empty" })
  }

  try {
    const query = {
      v: 3,
      q: {
        db: ["t"],
        find: {
          $query: {
            "tokenDetails.tokenIdHex": tokenId
          }
        },
        project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
        limit: 10
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from BitDB.
    const tokenRes = await axios.get(url)

    const formattedTokens = []

    if (tokenRes.data.t.length) {
      tokenRes.data.t.forEach(token => {
        token = formatTokenOutput(token)
        formattedTokens.push(token.tokenDetails)
      })
    }

    res.status(200)
    return res.json(formattedTokens[0])
  } catch (err) {
    wlogger.error(`Error in slp.ts/tokenStats().`, err)

    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /tokenStats: ${err.message}` })
  }
}

/**
 * @api {get} /slp/transactions/{tokenId}/{address}  SLP transactions by tokenId and address.
 * @apiName SLP transactions by tokenId and address.
 * @apiGroup SLP
 * @apiDescription Transactions by tokenId and address.
 *
 *
 * @apiExample Example usage:
 * curl -X GET "https://mainnet.bchjs.cash/v3/slp/transactions/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0/simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l" -H "accept:application/json"
 *
 *
 */
// Retrieve transactions by tokenId and address.
async function txsTokenIdAddressSingle(req, res, next) {
  try {
    // Validate the input data.
    const tokenId = req.params.tokenId
    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const query = {
      v: 3,
      q: {
        find: {
          db: ["c", "u"],
          $query: {
            $or: [
              {
                "in.e.a": address
              },
              {
                "out.e.a": address
              }
            ],
            "slp.detail.tokenIdHex": tokenId
          },
          $orderby: {
            "blk.i": -1
          }
        },
        limit: 100
      },
      r: {
        f: "[.[] | { txid: .tx.h, tokenDetails: .slp } ]"
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.SLPDB_URL}q/${b64}`

    // Get data from SLPDB.
    const tokenRes = await axios.get(url)
    //console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data,null,2)}`)

    return res.json(tokenRes.data.c)
  } catch (err) {
    wlogger.error(`Error in slp.ts/txsTokenIdAddressSingle().`, err)

    // Decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({
      error: `Error in /transactions/:tokenId/:address: ${err.message}`
    })
  }
}

// Generates a Basic Authorization header for slpserve.
function generateCredentials() {
  // Generate the Basic Authentication header for a private instance of SLPDB.
  const username = "BITBOX"
  const password = SLPDB_PASS
  const combined = `${username}:${password}`
  var base64Credential = Buffer.from(combined).toString("base64")
  var readyCredential = `Basic ${base64Credential}`

  const options = {
    headers: {
      authorization: readyCredential
    }
  }

  return options
}

// Format the response from SLPDB into an object.
async function formatToRestObject(slpDBFormat) {
  BigNumber.set({ DECIMAL_PLACES: 8 })

  // console.log(`slpDBFormat.data: ${JSON.stringify(slpDBFormat.data, null, 2)}`)

  const transaction = slpDBFormat.data.u.length
    ? slpDBFormat.data.u[0]
    : slpDBFormat.data.c[0]

  const inputs = transaction.in

  const outputs = transaction.out
  const tokenOutputs = transaction.slp.detail.outputs

  const sendOutputs = ["0"]
  tokenOutputs.map(x => {
    const string = parseFloat(x.amount) * 100000000
    sendOutputs.push(string.toString())
  })

  const obj = {
    tokenInfo: {
      versionType: transaction.slp.detail.versionType,
      transactionType: transaction.slp.detail.transactionType,
      tokenIdHex: transaction.slp.detail.tokenIdHex,
      sendOutputs: sendOutputs
    },
    tokenIsValid: transaction.slp.valid
  }

  return obj
}

module.exports = {
  router,
  testableComponents: {
    root,
    list,
    listSingleToken,
    listBulkToken,
    balancesForAddress,
    balancesForAddressBulk,
    balancesForAddressByTokenID,
    convertAddressSingle,
    convertAddressBulk,
    validateBulk,
    isValidSlpTxid,
    txDetails,
    tokenStats,
    balancesForTokenSingle,
    txsTokenIdAddressSingle
  }
}
