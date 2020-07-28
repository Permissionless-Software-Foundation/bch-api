'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const BigNumber = require('bignumber.js')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const Slpdb = require('./services/slpdb')

// const strftime = require('strftime')
const wlogger = require('../../util/winston-logging')

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

// Used to convert error messages to strings, to safely pass to users.
const util = require('util')
util.inspect.defaultOptions = { depth: 5 }

// Setup JSON RPC
// const BitboxHTTP = axios.create({
//   baseURL: process.env.RPC_BASEURL
// })
// const username = process.env.RPC_USERNAME
// const password = process.env.RPC_PASSWORD

// Determine the Access password for a private instance of SLPDB.
// https://gist.github.com/christroutner/fc717ca704dec3dded8b52fae387eab2
const SLPDB_PASS = process.env.SLPDB_PASS ? process.env.SLPDB_PASS : 'BITBOX'

// const rawtransactions = require('./full-node/rawtransactions')
const RawTransactions = require('./full-node/rawtransactions')
const rawTransactions = new RawTransactions()

// Setup REST and TREST URLs used by slpjs
// Dev note: this allows for unit tests to mock the URL.
if (!process.env.REST_URL) process.env.REST_URL = 'https://rest.bitcoin.com/v2/'
if (!process.env.TREST_URL) {
  process.env.TREST_URL = 'https://trest.bitcoin.com/v2/'
}

let _this

class Slp {
  constructor () {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.BigNumber = BigNumber
    _this.bchjs = bchjs
    _this.rawTransactions = rawTransactions
    _this.slpdb = new Slpdb()

    _this.router = router

    _this.router.get('/', _this.root)
    // _this.router.get('/list', _this.list)
    _this.router.get('/list/:tokenId', _this.listSingleToken)
    _this.router.post('/list', _this.listBulkToken)
    _this.router.get('/balancesForAddress/:address', _this.balancesForAddress)
    _this.router.post('/balancesForAddress', _this.balancesForAddressBulk)
    _this.router.get('/balancesForToken/:tokenId', _this.balancesForTokenSingle)
    _this.router.get(
      '/balance/:address/:tokenId',
      _this.balancesForAddressByTokenID
    )
    _this.router.get('/convert/:address', _this.convertAddressSingle)
    _this.router.post('/convert', _this.convertAddressBulk)
    _this.router.post('/validateTxid', _this.validateBulk)
    _this.router.get('/validateTxid/:txid', _this.validateSingle)
    _this.router.get('/txDetails/:txid', _this.txDetails)
    _this.router.get('/tokenStats/:tokenId', _this.tokenStats)
    _this.router.get(
      '/transactions/:tokenId/:address',
      _this.txsTokenIdAddressSingle
    )
    _this.router.get(
      '/transactionHistoryAllTokens/:address',
      _this.txsByAddressSingle
    )
    _this.router.post('/generateSendOpReturn', _this.generateSendOpReturn)
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

  formatTokenOutput (token) {
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
    token.tokenDetails.validAddresses =
      token.tokenStats.qty_valid_token_addresses
    token.tokenDetails.totalMinted = parseFloat(
      token.tokenStats.qty_token_minted
    )
    token.tokenDetails.totalBurned = parseFloat(
      token.tokenStats.qty_token_burned
    )
    token.tokenDetails.circulatingSupply = parseFloat(
      token.tokenStats.qty_token_circulating_supply
    )
    token.tokenDetails.mintingBatonStatus =
      token.tokenStats.minting_baton_status

    delete token.tokenStats.block_last_active_send
    delete token.tokenStats.block_last_active_mint
    delete token.tokenStats.qty_valid_txns_since_genesis
    delete token.tokenStats.qty_valid_token_addresses
    return token
  }

  root (req, res, next) {
    return res.json({ status: 'slp' })
  }

  /**
   * @api {get} /slp/list/{tokenId}  List single SLP token by id.
   * @apiName List single SLP token by id.
   * @apiGroup SLP
   * @apiDescription Returns the list single SLP token by id.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/slp/list/259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1" -H "accept:application/json"
   *
   *
   */
  async listSingleToken (req, res, next) {
    try {
      const tokenId = req.params.tokenId

      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const t = await _this.lookupToken(tokenId)

      res.status(200)
      return res.json(t)
    } catch (err) {
      wlogger.error('Error in slp.ts/listSingleToken().', err)
      return _this.errorHandler(err, res)

      // return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
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
   * curl -X POST "https://api.fullstack.cash/v3/slp/list" -H "accept:application/json" -H "Content-Type: application/json" -d '{"tokenIds":["7380843cd1089a1a01783f86af37734dc99667a1cdc577391b5f6ea42fc1bfb4","9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0"]}'
   *
   *
   */
  async listBulkToken (req, res, next) {
    try {
      const tokenIds = req.body.tokenIds

      // Reject if tokenIds is not an array.
      if (!Array.isArray(tokenIds)) {
        res.status(400)
        return res.json({
          error: 'tokenIds needs to be an array. Use GET for single tokenId.'
        })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, tokenIds)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      const query = {
        v: 3,
        q: {
          db: ['t'],
          find: {
            'tokenDetails.tokenIdHex': {
              $in: tokenIds
            }
          },
          project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
          sort: { 'tokenStats.block_created': -1 },
          limit: 10000
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`
      // Request options
      const opt = {
        method: 'get',
        baseURL: url
      }
      const tokenRes = await _this.axios.request(opt)

      const formattedTokens = []
      const txids = []

      if (tokenRes.data.t.length) {
        tokenRes.data.t.forEach((token) => {
          txids.push(token.tokenDetails.tokenIdHex)
          token = _this.formatTokenOutput(token)
          formattedTokens.push(token.tokenDetails)
        })
      }

      tokenIds.forEach((tokenId) => {
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
      wlogger.error('Error in slp.ts/listBulkToken().', err)
      return _this.errorHandler(err, res)

      // return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
    }
  }

  async lookupToken (tokenId) {
    try {
      const query = {
        v: 3,
        q: {
          db: ['t'],
          find: {
            $query: {
              'tokenDetails.tokenIdHex': tokenId
            }
          },
          project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
          limit: 1000
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      // console.log(`url: ${url}`)
      // Request options
      const opt = {
        method: 'get',
        baseURL: url
      }
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${util.inspect(tokenRes.data,null,2)}`)
      // console.log(
      //  `tokenRes.data.t[0]: ${util.inspect(tokenRes.data.t[0], null, 2)}`
      // )

      const formattedTokens = []

      if (tokenRes.data.t.length) {
        tokenRes.data.t.forEach((token) => {
          token = _this.formatTokenOutput(token)
          formattedTokens.push(token.tokenDetails)
        })
      }

      let t
      formattedTokens.forEach((token) => {
        if (token.id === tokenId) t = token
      })

      // If token could not be found.
      if (t === undefined) {
        t = {
          id: 'not found'
        }
      }

      return t
    } catch (err) {
      wlogger.error('Error in slp.ts/lookupToken().', err)
      // console.log(`Error in slp.ts/lookupToken()`)
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/balancesForAddress/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
   *
   *
   */
  // Retrieve token balances for all tokens for a single address.
  async balancesForAddress (req, res, next) {
    try {
      // Validate the input data.
      const address = req.params.address
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      // Ensure the input is a valid BCH address.
      try {
        _this.bchjs.SLP.Address.toCashAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      const query = {
        v: 3,
        q: {
          db: ['g'],
          aggregate: [
            {
              $match: {
                'graphTxn.outputs': {
                  $elemMatch: {
                    address: _this.bchjs.SLP.Address.toSLPAddress(address),
                    status: 'UNSPENT',
                    slpAmount: { $gte: 0 }
                  }
                }
              }
            },
            {
              $unwind: '$graphTxn.outputs'
            },
            {
              $match: {
                'graphTxn.outputs.address': _this.bchjs.SLP.Address.toSLPAddress(
                  address
                ),
                'graphTxn.outputs.status': 'UNSPENT',
                'graphTxn.outputs.slpAmount': { $gte: 0 }
              }
            },
            {
              $project: {
                amount: '$graphTxn.outputs.slpAmount',
                address: '$graphTxn.outputs.address',
                txid: '$graphTxn.txid',
                vout: '$graphTxn.outputs.vout',
                tokenId: '$tokenDetails.tokenIdHex'
              }
            },
            {
              $group: {
                _id: '$tokenId',
                balanceString: {
                  $sum: '$amount'
                },
                slpAddress: {
                  $first: '$address'
                }
              }
            }
          ],
          limit: 10000
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      const options = _this.generateCredentials()
      // Request options
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data.g: ${JSON.stringify(tokenRes.data.g, null, 2)}`)

      const tokenIds = []
      if (tokenRes.data.g.length > 0) {
        tokenRes.data.g = tokenRes.data.g.map((token) => {
          token.tokenId = token._id
          tokenIds.push(token.tokenId)
          token.balance = parseFloat(token.balanceString)

          delete token._id

          return token
        })

        const promises = tokenIds.map(async (tokenId) => {
          const query2 = {
            v: 3,
            q: {
              db: ['t'],
              find: {
                $query: {
                  'tokenDetails.tokenIdHex': tokenId
                }
              },
              project: {
                'tokenDetails.decimals': 1,
                'tokenDetails.tokenIdHex': 1,
                _id: 0
              },
              limit: 1000
            }
          }

          const s2 = JSON.stringify(query2)
          const b642 = Buffer.from(s2).toString('base64')
          const url2 = `${process.env.SLPDB_URL}q/${b642}`
          // Request options
          const opt = {
            method: 'get',
            baseURL: url2,
            headers: options.headers,
            timeout: options.timeout
          }
          const tokenRes2 = await _this.axios.request(opt)
          // console.log(`tokenRes2.data: ${JSON.stringify(tokenRes2.data, null, 2)}`)

          return tokenRes2.data
        })

        const details = await _this.axios.all(promises)

        tokenRes.data.g = tokenRes.data.g.map((token) => {
          details.forEach((detail) => {
            if (detail.t[0].tokenDetails.tokenIdHex === token.tokenId) {
              token.decimalCount = detail.t[0].tokenDetails.decimals
            }
          })
          return token
        })

        return res.json(tokenRes.data.g)
      }

      return res.json('No balance for this address')
    } catch (err) {
      wlogger.error('Error in slp.ts/balancesForAddress().', err)

      return _this.errorHandler(err, res)

      // return res.json({
      //   error: `Error in /address/:address: ${err.message}`
      // })
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
   * curl -X POST "https://api.fullstack.cash/v3/slp/balancesForAddress" -d "{\"addresses\":[\"simpleledger:qqss4zp80hn6szsa4jg2s9fupe7g5tcg5ucdyl3r57\"]}" -H "accept:application/json"
   *
   *
   */
  async balancesForAddressBulk (req, res, next) {
    try {
      const addresses = req.body.addresses

      // Reject if addresses is not an array.
      if (!Array.isArray(addresses)) {
        res.status(400)
        return res.json({ error: 'addresses needs to be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, addresses)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      wlogger.debug(
        'Executing slp/balancesForAddresss with these addresses: ',
        addresses
      )

      // Loop through each address and do error checking.
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]

        // Validate the input data.
        if (!address || address === '') {
          res.status(400)
          return res.json({ error: 'address can not be empty' })
        }

        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.SLP.Address.toCashAddress(address)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${address}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
        const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error:
              'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
          })
        }
      }

      const options = _this.generateCredentials()

      // Collect an array of promises, one for each request to slpserve.
      // This is a nested array of promises.
      const balancesPromises = addresses.map(async (address) => {
        const query = {
          v: 3,
          q: {
            db: ['g'],
            aggregate: [
              {
                $match: {
                  'graphTxn.outputs': {
                    $elemMatch: {
                      address: _this.bchjs.SLP.Address.toSLPAddress(address),
                      status: 'UNSPENT',
                      slpAmount: { $gte: 0 }
                    }
                  }
                }
              },
              {
                $unwind: '$graphTxn.outputs'
              },
              {
                $match: {
                  'graphTxn.outputs.address': _this.bchjs.SLP.Address.toSLPAddress(
                    address
                  ),
                  'graphTxn.outputs.status': 'UNSPENT',
                  'graphTxn.outputs.slpAmount': { $gte: 0 }
                }
              },
              {
                $project: {
                  amount: '$graphTxn.outputs.slpAmount',
                  address: '$graphTxn.outputs.address',
                  txid: '$graphTxn.txid',
                  vout: '$graphTxn.outputs.vout',
                  tokenId: '$tokenDetails.tokenIdHex'
                }
              },
              {
                $group: {
                  _id: '$tokenId',
                  balanceString: {
                    $sum: '$amount'
                  },
                  slpAddress: {
                    $first: '$address'
                  }
                }
              }
            ],
            limit: 10000
          }
        }

        const s = JSON.stringify(query)
        const b64 = Buffer.from(s).toString('base64')
        const url = `${process.env.SLPDB_URL}q/${b64}`
        // Request options
        const opt = {
          method: 'get',
          baseURL: url,
          headers: options.headers,
          timeout: options.timeout
        }
        const tokenRes = await _this.axios.request(opt)
        // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

        const tokenIds = []

        if (tokenRes.data.g.length > 0) {
          tokenRes.data.g = tokenRes.data.g.map((token) => {
            token.tokenId = token._id
            tokenIds.push(token.tokenId)
            token.balance = parseFloat(token.balanceString)
            delete token._id
            return token
          })
        }

        // Collect another array of promises.
        const promises = tokenIds.map(async (tokenId) => {
          const query2 = {
            v: 3,
            q: {
              db: ['t'],
              find: {
                $query: {
                  'tokenDetails.tokenIdHex': tokenId
                }
              },
              project: {
                'tokenDetails.decimals': 1,
                'tokenDetails.tokenIdHex': 1,
                _id: 0
              },
              limit: 1000
            }
          }

          const s2 = JSON.stringify(query2)
          const b642 = Buffer.from(s2).toString('base64')
          const url2 = `${process.env.SLPDB_URL}q/${b642}`
          const opt = {
            method: 'get',
            baseURL: url2,
            headers: options.headers,
            timeout: options.timeout
          }
          const tokenRes2 = await _this.axios.request(opt)
          // console.log(`tokenRes2.data: ${JSON.stringify(tokenRes2.data, null, 2)}`)

          return tokenRes2.data
        })

        // Wait for all the promises to resolve.
        const details = await Promise.all(promises)

        tokenRes.data.g = tokenRes.data.g.map((token) => {
          details.forEach((detail) => {
            if (detail.t[0].tokenDetails.tokenIdHex === token.tokenId) {
              token.decimalCount = detail.t[0].tokenDetails.decimals
            }
          })

          return token
        })

        return tokenRes.data.g
      })

      // Wait for all the promises to resolve.
      const axiosResult = await _this.axios.all(balancesPromises)

      return res.json(axiosResult)
    } catch (err) {
      wlogger.error('Error in slp.js/balancesForAddressBulk().', err)

      return _this.errorHandler(err, res)
      // return res.json({
      //   error: `Error in POST balancesForAddress: ${err.message}`
      // })
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/balancesForToken/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
   *
   *
   */
  // Retrieve token balances for all addresses by single tokenId.
  async balancesForTokenSingle (req, res, next) {
    try {
      // Validate the input data.
      const tokenId = req.params.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const query = {
        v: 3,
        q: {
          db: ['g'],
          aggregate: [
            {
              $match: {
                'graphTxn.outputs': {
                  $elemMatch: {
                    status: 'UNSPENT',
                    slpAmount: { $gte: 0 }
                  }
                },
                'tokenDetails.tokenIdHex': tokenId
              }
            },
            {
              $unwind: '$graphTxn.outputs'
            },
            {
              $match: {
                'graphTxn.outputs.status': 'UNSPENT',
                'graphTxn.outputs.slpAmount': { $gte: 0 },
                'tokenDetails.tokenIdHex': tokenId
              }
            },
            {
              $project: {
                token_balance: '$graphTxn.outputs.slpAmount',
                address: '$graphTxn.outputs.address',
                txid: '$graphTxn.txid',
                vout: '$graphTxn.outputs.vout',
                tokenId: '$tokenDetails.tokenIdHex'
              }
            },
            {
              $group: {
                _id: '$address',
                token_balance: {
                  $sum: '$token_balance'
                }
              }
            }
          ],
          limit: 10000
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      const options = _this.generateCredentials()
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      // Get data from SLPDB.
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      const resBalances = tokenRes.data.g.map((addy, index) => {
        delete addy.satoshis_balance
        addy.tokenBalanceString = addy.token_balance
        addy.slpAddress = addy._id
        addy.tokenId = tokenId
        delete addy._id
        delete addy.token_balance

        return addy
      })

      return res.json(resBalances)
    } catch (err) {
      wlogger.error('Error in slp.ts/balancesForTokenSingle().', err)

      return _this.errorHandler(err, res)
      // return res.json({
      //   error: `Error in /balancesForToken/:tokenId: ${err.message}`
      // })
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/balance/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m/1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125" -H "accept:application/json"
   *
   *
   */
  // Retrieve token balances for a single token class, for a single address.
  async balancesForAddressByTokenID (req, res, next) {
    try {
      // Validate input data.
      const address = req.params.address
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      const tokenId = req.params.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      // Ensure the input is a valid BCH address.
      try {
        _this.bchjs.SLP.Address.toCashAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      // Convert input to an simpleledger: address.
      const slpAddr = _this.bchjs.SLP.Address.toSlpAddress(req.params.address)

      const query = {
        v: 3,
        q: {
          db: ['g'],
          aggregate: [
            {
              $match: {
                'graphTxn.outputs': {
                  $elemMatch: {
                    address: slpAddr,
                    status: 'UNSPENT',
                    slpAmount: { $gte: 0 }
                  }
                }
              }
            },
            {
              $unwind: '$graphTxn.outputs'
            },
            {
              $match: {
                'graphTxn.outputs.address': slpAddr,
                'graphTxn.outputs.status': 'UNSPENT',
                'graphTxn.outputs.slpAmount': { $gte: 0 }
              }
            },
            {
              $project: {
                amount: '$graphTxn.outputs.slpAmount',
                address: '$graphTxn.outputs.address',
                txid: '$graphTxn.txid',
                vout: '$graphTxn.outputs.vout',
                tokenId: '$tokenDetails.tokenIdHex'
              }
            },
            {
              $group: {
                _id: '$tokenId',
                balanceString: {
                  $sum: '$amount'
                },
                slpAddress: {
                  $first: '$address'
                }
              }
            }
          ],
          limit: 10000
        }
      }

      const options = _this.generateCredentials()

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      // Get data from SLPDB.
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      const tokenRes = await _this.axios.request(opt)
      console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      let resVal = {
        cashAddress: _this.bchjs.SLP.Address.toCashAddress(slpAddr),
        legacyAddress: _this.bchjs.SLP.Address.toLegacyAddress(slpAddr),
        slpAddress: slpAddr,
        tokenId: tokenId,
        balance: 0,
        balanceString: '0'
      }

      if (tokenRes.data.g.length > 0) {
        tokenRes.data.g.forEach(async (token) => {
          if (token._id === tokenId) {
            resVal = {
              cashAddress: _this.bchjs.SLP.Address.toCashAddress(slpAddr),
              legacyAddress: _this.bchjs.SLP.Address.toLegacyAddress(slpAddr),
              slpAddress: slpAddr,
              tokenId: token._id,
              balance: parseFloat(token.balanceString),
              balanceString: token.balanceString
            }
          }
        })
      } else {
        resVal = {
          cashAddress: _this.bchjs.SLP.Address.toCashAddress(slpAddr),
          legacyAddress: _this.bchjs.SLP.Address.toLegacyAddress(slpAddr),
          slpAddress: slpAddr,
          tokenId: tokenId,
          balance: 0,
          balanceString: '0'
        }
      }

      res.status(200)
      return res.json(resVal)
    } catch (err) {
      wlogger.error('Error in slp.ts/balancesForAddressByTokenID().', err)

      return _this.errorHandler(err, res)
      // return res.json({
      //   error: `Error in /balance/:address/:tokenId: ${err.message}`
      // })
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/convert/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
   *
   *
   */
  async convertAddressSingle (req, res, next) {
    try {
      const address = req.params.address

      // Validate input
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      const slpAddr = _this.bchjs.SLP.Address.toSLPAddress(address)

      const obj = {
        slpAddress: '',
        cashAddress: '',
        legacyAddress: ''
      }
      obj.slpAddress = slpAddr
      obj.cashAddress = _this.bchjs.SLP.Address.toCashAddress(slpAddr)
      obj.legacyAddress = _this.bchjs.SLP.Address.toLegacyAddress(
        obj.cashAddress
      )

      res.status(200)
      return res.json(obj)
    } catch (err) {
      wlogger.error('Error in slp.ts/convertAddressSingle().', err)
      return _this.errorHandler(err, res)
      // return res.json({
      //   error: `Error in /address/convert/:address: ${err.message}`
      // })
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
   * curl -X POST "https://api.fullstack.cash/v3/slp/convert" -H "accept:application/json" -H "Content-Type: application/json" -d '{"addresses":["simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l"]}'
   *
   *
   */
  async convertAddressBulk (req, res, next) {
    const addresses = req.body.addresses

    // Reject if hashes is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: 'addresses needs to be an array. Use GET for single address.'
      })
    }

    // Enforce array size rate limits
    if (!_this.routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: 'Array too large.'
      })
    }

    // Convert each address in the array.
    const convertedAddresses = []
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]

      // Validate input
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      const slpAddr = _this.bchjs.SLP.Address.toSLPAddress(address)

      const obj = {
        slpAddress: '',
        cashAddress: '',
        legacyAddress: ''
      }
      obj.slpAddress = slpAddr
      obj.cashAddress = _this.bchjs.SLP.Address.toCashAddress(slpAddr)
      obj.legacyAddress = _this.bchjs.SLP.Address.toLegacyAddress(
        obj.cashAddress
      )

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
   * curl -X POST "https://api.fullstack.cash/v3/slp/validateTxid" -H "accept:application/json" -H "Content-Type: application/json" -d '{"txids":["f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a","fb0eeaa501a6e1acb721669c62a3f70741f48ae0fd7f4b8e1d72088785c51952"]}'
   *
   *
   */
  async validateBulk (req, res, next) {
    try {
      const txids = req.body.txids

      // Reject if txids is not an array.
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({ error: 'txids needs to be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, txids)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      wlogger.debug('Executing slp/validate with these txids: ', txids)

      const query = {
        v: 3,
        q: {
          db: ['c', 'u'],
          find: {
            'tx.h': { $in: txids }
          },
          limit: 300,
          project: { 'slp.valid': 1, 'tx.h': 1, 'slp.invalidReason': 1 }
        }
      }
      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      const options = _this.generateCredentials()

      // Get data from SLPDB.
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      let formattedTokens = []

      // Combine the arrays. Why? Generally there is nothing in the u array.
      const concatArray = tokenRes.data.c.concat(tokenRes.data.u)

      const tokenIds = []
      if (concatArray.length > 0) {
        concatArray.forEach((token) => {
          tokenIds.push(token.tx.h) // txid

          const validationResult = {
            txid: token.tx.h,
            valid: token.slp.valid
          }

          // If the txid is invalid, add the reason it's invalid.
          if (!validationResult.valid) {
            validationResult.invalidReason = token.slp.invalidReason
          }

          formattedTokens.push(validationResult)
        })

        // If a user-provided txid doesn't exist in the data, add it with
        // valid:false property.
        txids.forEach((txid) => {
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
          const elem = formattedTokens.filter((x) => x.txid === thisTxid)

          newOutput.push(elem[0])
        }

        // Replace the original output object with the new output object.
        formattedTokens = newOutput
      }

      res.status(200)
      return res.json(formattedTokens)
    } catch (err) {
      wlogger.error('Error in slp.ts/validateBulk().', err)

      return _this.errorHandler(err, res)
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/validateTxid/f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a" -H "accept:application/json"
   *
   *
   */
  async validateSingle (req, res, next) {
    try {
      const txid = req.params.txid

      // Validate input
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      wlogger.debug('Executing slp/validate/:txid with this txid: ', txid)

      const query = {
        v: 3,
        q: {
          db: ['c', 'u'],
          find: {
            'tx.h': txid
          },
          limit: 300,
          project: { 'slp.valid': 1, 'tx.h': 1, 'slp.invalidReason': 1 }
        }
      }

      const options = _this.generateCredentials()

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      // Get data from SLPDB.
      const tokenRes = await _this.axios.request(opt)

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
        if (!result.valid) {
          result.invalidReason = concatArray[0].slp.invalidReason
        }
      }

      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error('Error in slp.ts/validateSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a Boolean if the input TXID is a valid SLP TXID.
  // async function isValidSlpTxid (txid) {
  //   const isValid = await slpValidator.isValidSlpTxid(txid)
  //   return isValid
  // }

  /**
   * @api {get} /slp/txDetails/{txid}  SLP transaction details.
   * @apiName SLP transaction details.
   * @apiGroup SLP
   * @apiDescription Transaction details on a token transfer.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/slp/txDetails/8ab4ac5dea3f9024e3954ee5b61452955d659a34561f79ef62ac44e133d0980e" -H "accept:application/json"
   *
   *
   */
  async txDetails (req, res, next) {
    try {
      // Validate input parameter
      const txid = req.params.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      if (txid.length !== 64) {
        res.status(400)
        return res.json({ error: 'This is not a txid' })
      }

      const query = {
        v: 3,
        db: ['g'],
        q: {
          find: {
            'tx.h': txid
          },
          limit: 300
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`

      const options = _this.generateCredentials()
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      // Get token data from SLPDB
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes: ${util.inspect(tokenRes)}`)

      if (tokenRes.data.c.length === 0) {
        res.status(404)
        return res.json({ error: 'TXID not found' })
      }

      // Format the returned data to an object.
      const formatted = await _this.formatToRestObject(tokenRes)
      // console.log(`formatted: ${JSON.stringify(formatted,null,2)}`)

      // Get information on the transaction from Insight API.
      // const retData = await transactions.transactionsFromInsight(txid)
      const retData = await _this.rawTransactions.getRawTransactionsFromNode(
        txid,
        true
      )
      // console.log(`retData: ${JSON.stringify(retData, null, 2)}`)

      // Return both the tx data from Insight and the formatted token information.
      const response = {
        retData,
        ...formatted
      }

      res.status(200)
      return res.json(response)
    } catch (err) {
      wlogger.error('Error in slp.ts/txDetails().', err)

      // Handle corner case of mis-typted txid
      // if (err.error && err.error.indexOf('Not found') > -1) {
      //   res.status(400)
      //   return res.json({ error: 'TXID not found' })
      // }

      return _this.errorHandler(err, res)
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/tokenStats/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
   *
   *
   */
  async tokenStats (req, res, next) {
    try {
      const tokenId = req.params.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const tokenStats = await _this.slpdb.getTokenStats(tokenId)

      res.status(200)
      return res.json(tokenStats)
    } catch (err) {
      wlogger.error('Error in slp.ts/tokenStats().', err)
      return _this.errorHandler(err, res)
      // return res.json({ error: `Error in /tokenStats: ${err.message}` })
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
   * curl -X GET "https://api.fullstack.cash/v3/slp/transactions/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0/simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l" -H "accept:application/json"
   *
   *
   */
  // Retrieve transactions by tokenId and address.
  async txsTokenIdAddressSingle (req, res, next) {
    try {
      // Validate the input data.
      const tokenId = req.params.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const address = req.params.address
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      const query = {
        v: 3,
        q: {
          find: {
            db: ['c', 'u'],
            $query: {
              $or: [
                {
                  'in.e.a': address
                },
                {
                  'out.e.a': address
                }
              ],
              'slp.detail.tokenIdHex': tokenId
            },
            $orderby: {
              'blk.i': -1
            }
          },
          limit: 100
        },
        r: {
          f: '[.[] | { txid: .tx.h, tokenDetails: .slp } ]'
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_URL}q/${b64}`
      const opt = {
        method: 'get',
        baseURL: url
      }
      // Get data from SLPDB.
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      return res.json(tokenRes.data.c)
    } catch (err) {
      wlogger.error('Error in slp.ts/txsTokenIdAddressSingle().', err)

      return _this.errorHandler(err, res)
      // return res.json({
      //   error: `Error in /transactions/:tokenId/:address: ${err.message}`
      // })
    }
  }

  // Generates a Basic Authorization header for slpserve.
  generateCredentials () {
    // Generate the Basic Authentication header for a private instance of SLPDB.
    const username = 'BITBOX'
    const password = SLPDB_PASS
    const combined = `${username}:${password}`
    var base64Credential = Buffer.from(combined).toString('base64')
    var readyCredential = `Basic ${base64Credential}`

    const options = {
      headers: {
        authorization: readyCredential
      },
      timeout: 15000
    }

    return options
  }

  // Format the response from SLPDB into an object.
  async formatToRestObject (slpDBFormat) {
    _this.BigNumber.set({ DECIMAL_PLACES: 8 })

    // console.log(`slpDBFormat.data: ${JSON.stringify(slpDBFormat.data, null, 2)}`)

    const transaction = slpDBFormat.data.u.length
      ? slpDBFormat.data.u[0]
      : slpDBFormat.data.c[0]

    // const inputs = transaction.in

    // const outputs = transaction.out
    const tokenOutputs = transaction.slp.detail.outputs

    const sendOutputs = ['0']
    tokenOutputs.map((x) => {
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

  // Retrieve transactions by address.
  async txsByAddressSingle (req, res, next) {
    try {
      // Validate the input data.
      const address = req.params.address
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      // Ensure the input is a valid BCH address.
      try {
        _this.bchjs.SLP.Address.toCashAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Ensure it is using the correct network.
      const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
      const networkIsValid = routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      const transactions = await _this.slpdb.getHistoricalSlpTransactions([
        address
      ])
      // console.log(`transactions: ${JSON.stringify(transactions, null, 2)}`)

      res.status(200)
      return res.json(transactions)
    } catch (err) {
      wlogger.error('Error in slp.ts/txsByAddressSingle().', err)

      // Decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      res.status(500)
      return res.json({
        error: `Error in /transactionHistoryAllTokens/:address: ${err.message}`
      })
    }
  }

  /**
   * @api {post} /slp/generateSendOpReturn/ generateSendOpReturn
   * @apiName SLP generateSendOpReturn
   * @apiGroup SLP
   * @apiDescription Generate the hex required for a SLP Send OP_RETURN.
   *
   * This will return a hexidecimal representation of the OP_RETURN code that
   * can be used to generate an SLP Send transaction. The number of outputs
   * (1 or 2) will also be returned.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/slp/generateSendOpReturn" -H "accept:application/json" -H "Content-Type: application/json" -d '{"tokenUtxos":[{"tokenId": "0a321bff9761f28e06a268b14711274bb77617410a16807bd0437ef234a072b1","decimals": 0, "tokenQty": 2}], "sendQty": 1.5}'
   *
   *
   */
  // Get OP_RETURN script and outputs
  async generateSendOpReturn (req, res, next) {
    try {
      const tokenUtxos = req.body.tokenUtxos
      // console.log(`tokenUtxos: `, tokenUtxos)

      const _sendQty = req.body.sendQty
      const sendQty = Number(_sendQty)

      // console.log(`sendQty: `, sendQty)

      // Reject if tokenUtxos is not an array.
      if (!Array.isArray(tokenUtxos)) {
        res.status(400)
        return res.json({
          error: 'tokenUtxos needs to be an array.'
        })
      }

      // Reject if tokenUtxos array is empty.
      if (!tokenUtxos.length) {
        res.status(400)
        return res.json({
          error: 'tokenUtxos array can not be empty.'
        })
      }

      // Reject if sendQty is not an number.
      if (!sendQty) {
        res.status(400)
        return res.json({
          error: 'sendQty must be a number.'
        })
      }

      const opReturn = await _this.bchjs.SLP.TokenType1.generateSendOpReturn(
        tokenUtxos,
        sendQty
      )

      const script = opReturn.script.toString('hex')
      // console.log(`script: ${script}`)

      res.status(200)
      return res.json({ script, outputs: opReturn.outputs })
    } catch (err) {
      wlogger.error('Error in slp.js/generateSendOpReturn().', err)

      // Decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      res.status(500)
      return res.json({
        error: 'Error in /generateSendOpReturn()'
      })
    }
  }
}

module.exports = Slp
