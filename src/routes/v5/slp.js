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

// Instantiate a local copy of bch-js using the local REST API server.
const LOCAL_RESTURL = process.env.LOCAL_RESTURL
  ? process.env.LOCAL_RESTURL
  : 'https://api.fullstack.cash/v5/'

const BCHJS = require('@psf/bch-js')
// const BCHJS = require('../../../../bch-js')
const bchjs = new BCHJS({ restURL: LOCAL_RESTURL })

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
// Password for General Purpose (GP) SLPDB.
const SLPDB_PASS_GP = process.env.SLPDB_PASS_GP
  ? process.env.SLPDB_PASS_GP
  : 'BITBOX'
// Password for Whitelist (WL) SLPDB.
const SLPDB_PASS_WL = process.env.SLPDB_PASS_WL
  ? process.env.SLPDB_PASS_WL
  : 'BITBOX'

// const rawtransactions = require('./full-node/rawtransactions')
const RawTransactions = require('./full-node/rawtransactions')
const rawTransactions = new RawTransactions()

// Setup REST and TREST URLs used by slpjs
// Dev note: this allows for unit tests to mock the URL.
if (!process.env.REST_URL) {
  process.env.REST_URL = 'https://bchn.fullstack.cash/v5/'
}
if (!process.env.TREST_URL) {
  process.env.TREST_URL = 'https://testnet.fullstack.cash/v5/'
}

let _this

class Slp {
  constructor () {
    _this = this

    // Encapsulate external libraries.
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
    _this.router.get('/convert/:address', _this.convertAddressSingle)
    _this.router.post('/convert', _this.convertAddressBulk)
    _this.router.post('/validateTxid', _this.validateBulk)
    _this.router.get('/validateTxid/:txid', _this.validateSingle)
    _this.router.get('/validateTxid2/:txid', _this.validate2Single)
    _this.router.get('/validateTxid3/:txid', _this.validate3Single)
    _this.router.post('/validateTxid3', _this.validate3Bulk)
    _this.router.get('/whitelist', _this.getSlpWhitelist)
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
    _this.router.post('/hydrateUtxos', _this.hydrateUtxos)
    _this.router.post('/hydrateUtxosWL', _this.hydrateUtxosWL)
    _this.router.get('/status', _this.getStatus)
    _this.router.get('/nftChildren/:tokenId', _this.getNftChildren)
    _this.router.get('/nftGroup/:tokenId', _this.getNftGroup)
  }

  // DRY error handler.
  errorHandler (err, res) {
    // console.error('Entering slp.js/errorHandler(). err: ', err)

    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    console.log('slp.js/errorHandler msg from decodeError: ', msg)
    console.log('slp.js/errorHandler status from decodeError: ', status)

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

    if (token.tokenDetails.versionType === 65 && token.nftParentId) {
      token.tokenDetails.nftParentId = token.nftParentId
    }

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
   * curl -X GET "https://api.fullstack.cash/v5/slp/list/259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1" -H "accept:application/json"
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
   * curl -X POST "https://api.fullstack.cash/v5/slp/list" -H "accept:application/json" -H "Content-Type: application/json" -d '{"tokenIds":["7380843cd1089a1a01783f86af37734dc99667a1cdc577391b5f6ea42fc1bfb4","9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0"]}'
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
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
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
          project: { tokenDetails: 1, tokenStats: 1, nftParentId: 1, _id: 0 },
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
   * curl -X GET "https://api.fullstack.cash/v5/slp/balancesForAddress/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
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
                'graphTxn.outputs.address':
                  _this.bchjs.SLP.Address.toSLPAddress(address),
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

      const options = _this.generateCredentialsGP()
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
   * curl -X POST "https://api.fullstack.cash/v5/slp/balancesForAddress" -d "{\"addresses\":[\"simpleledger:qqss4zp80hn6szsa4jg2s9fupe7g5tcg5ucdyl3r57\"]}" -H "accept:application/json"
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
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
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

      const options = _this.generateCredentialsGP()

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
                  'graphTxn.outputs.address':
                    _this.bchjs.SLP.Address.toSLPAddress(address),
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
   * curl -X GET "https://api.fullstack.cash/v5/slp/balancesForToken/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
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

      const options = _this.generateCredentialsGP()
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
   * @api {get} /slp/convert/{address}  Convert address to slpAddr, cashAddr and legacy.
   * @apiName Convert address to slpAddr, cashAddr and legacy.
   * @apiGroup SLP
   * @apiDescription Convert address to slpAddr, cashAddr and legacy.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/convert/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m" -H "accept:application/json"
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
   * curl -X POST "https://api.fullstack.cash/v5/slp/convert" -H "accept:application/json" -H "Content-Type: application/json" -d '{"addresses":["simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l"]}'
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
      res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
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
   * curl -X POST "https://api.fullstack.cash/v5/slp/validateTxid" -H "accept:application/json" -H "Content-Type: application/json" -d '{"txids":["f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a","fb0eeaa501a6e1acb721669c62a3f70741f48ae0fd7f4b8e1d72088785c51952"]}'
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
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
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
      // console.log('url: ', url)

      const options = _this.generateCredentialsGP()

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

      // Combine the confirmed and unconfirmed collections.
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
        // valid:null property.
        // 'null' indicates that SLPDB does not know about the transaction. It
        // either has not seen it or has not processed it yet. A determination
        // can not be made.
        txids.forEach((txid) => {
          if (!tokenIds.includes(txid)) {
            formattedTokens.push({
              txid: txid,
              valid: null
            })
          }
        })
      } else {
        // Corner case: No results were returned from SLPDB. Mark each entry
        // as 'null'
        for (let i = 0; i < txids.length; i++) {
          formattedTokens.push({
            txid: txids[i],
            valid: null
          })
        }
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

      // Put the output array in the same order as the input array.
      const outAry = []
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]

        // Need to use Array.find() because the returned output array is out
        // of order with respect to the txid input array.
        const output = formattedTokens.find((elem) => elem.txid === thisTxid)
        // console.log(`output: ${JSON.stringify(output, null, 2)}`)

        outAry.push(output)
      }

      res.status(200)
      return res.json(outAry)
    } catch (err) {
      wlogger.error('Error in slp.ts/validateBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/validateTxid/{txid}  Validate single SLP transaction by txid.
   * @apiName Validate single SLP transaction by txid.
   * @apiGroup SLP
   * @apiDescription Validate single SLP transaction by txid, using SLPDB.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/validateTxid/f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a" -H "accept:application/json"
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

      const options = _this.generateCredentialsGP()

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
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      // Default return value.
      let result = {
        txid: txid,
        valid: null
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
      wlogger.error('Error in slp.js/validateSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/validateTxid2/{txid}  Validate 2 Single
   * @apiName Validate a single SLP transaction by txid using slp-validate.
   * @apiGroup SLP
   * @apiDescription Validate single SLP transaction by txid, using slp-validate.
   * Slower, less efficient method of validating an SLP TXID using the slp-validate
   * npm library. This method is independent of SLPDB and can be used as a fall-back
   * when SLPDB returns 'null' values.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/validateTxid2/f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a" -H "accept:application/json"
   *
   *
   */
  async validate2Single (req, res, next) {
    try {
      const txid = req.params.txid

      // Validate input
      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      wlogger.debug(
        'Executing slp/validate2Single/:txid with this txid: ',
        txid
      )

      // null by default.
      // Default return value.
      const result = {
        txid: txid,
        isValid: null,
        msg: ''
      }

      // Request options
      const opt = {
        method: 'get',
        baseURL: `${process.env.SLP_API_URL}slp/validate/${txid}`,
        timeout: 10000 // Exit after 10 seconds.
      }
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)
      // console.log(`tokenRes: `, tokenRes)

      // Overwrite the default value with the result from slp-api.
      result.isValid = tokenRes.data.isValid

      res.status(200)
      return res.json(result)
    } catch (err) {
      // console.log('validate2Single error: ', err)
      wlogger.error('Error in slp.ts/validate2Single().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/whitelist SLP token whitelist.
   * @apiName SLP token whitelist
   * @apiGroup SLP
   * @apiDescription Get tokens that are on the whitelist.
   * SLPDB is typically used to validate SLP transactions. It can become unstable
   * during periods of high network usage. A second SLPDB has been implemented
   * that is much more stable, because it only tracks a whitelist of SLP tokens.
   * This endpoint will return information on the SLP tokens that are included
   * in that whitelist.
   *
   * For tokens on the whitelist, the /slp/validateTxid3 endpoints can be used.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/whitelist" -H "accept:application/json"
   *
   */
  async getSlpWhitelist (req, res, next) {
    try {
      const list = [
        {
          name: 'USDH',
          tokenId:
            'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479'
        },
        {
          name: 'SPICE',
          tokenId:
            '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf'
        },
        {
          name: 'PSF',
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
        },
        {
          name: 'TROUT',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        },
        {
          name: 'PSFTEST',
          tokenId:
            'd0ef4de95b78222bfee2326ab11382f4439aa0855936e2fe6ac129a8d778baa0'
        }
      ]

      res.status(200)
      return res.json(list)
    } catch (err) {
      wlogger.error('Error in slp.ts/whitelist().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/validateTxid3/{txid}  Validate 3 Single
   * @apiName Validate a single txid against a whitelist SLPDB
   * @apiGroup SLP
   * @apiDescription Alternative validation for tokens on the whitelist
   * This endpoint is exactly the same as /slp/validateTxid/{txid} but it uses
   * a different SLPDB. This server only indexes the SLP tokens that are on the
   * whitelist. You can see which tokens are on the whitelist by calling the
   * /slp/whitelist endpoint.
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/validateTxid3/f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a" -H "accept:application/json"
   *
   *
   */
  async validate3Single (req, res, next) {
    try {
      const txid = req.params.txid
      // console.log('validate3Single txid: ', txid)

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

      const options = _this.generateCredentialsWL()

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString('base64')
      const url = `${process.env.SLPDB_WHITELIST_URL}q/${b64}`
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      // Get data from SLPDB.
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes.data: ${JSON.stringify(tokenRes.data, null, 2)}`)

      // Default return value.
      let result = {
        txid: txid,
        valid: null
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
      wlogger.error('Error in slp.js/validate3Single().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /slp/validateTxid3/  Validate 3 Bulk
   * @apiName Validate an array of TXIDs against a whitelist SLPDB
   * @apiGroup SLP
   * @apiDescription Alternative validation for tokens on the whitelist
   * This endpoint is exactly the same as /slp/validateTxid but it uses
   * a different SLPDB. This server only indexes the SLP tokens that are on the
   * whitelist. You can see which tokens are on the whitelist by calling the
   * /slp/whitelist endpoint.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v5/slp/validateTxid3" -H "accept:application/json" -H "Content-Type: application/json" -d '{"txids":["f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a","fb0eeaa501a6e1acb721669c62a3f70741f48ae0fd7f4b8e1d72088785c51952"]}'
   *
   *
   */
  async validate3Bulk (req, res, next) {
    try {
      const txids = req.body.txids
      // console.log(`validate3Bulk txids: `, txids)

      // Reject if txids is not an array.
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({ error: 'txids needs to be an array' })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, txids)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
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
      const url = `${process.env.SLPDB_WHITELIST_URL}q/${b64}`
      // console.log('url: ', url)

      const options = _this.generateCredentialsWL()

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

      // Combine the confirmed and unconfirmed collections.
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
        // valid:null property.
        // 'null' indicates that SLPDB does not know about the transaction. It
        // either has not seen it or has not processed it yet. A determination
        // can not be made.
        txids.forEach((txid) => {
          if (!tokenIds.includes(txid)) {
            formattedTokens.push({
              txid: txid,
              valid: null
            })
          }
        })
      } else {
        // Corner case: No results were returned from SLPDB. Mark each entry
        // as 'null'
        for (let i = 0; i < txids.length; i++) {
          formattedTokens.push({
            txid: txids[i],
            valid: null
          })
        }
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

      // console.log(
      //   `formattedTokens: ${JSON.stringify(formattedTokens, null, 2)}`
      // )

      // Put the output array in the same order as the input array.
      const outAry = []
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]

        // Need to use Array.find() because the returned output array is out
        // of order with respect to the txid input array.
        const output = formattedTokens.find((elem) => elem.txid === thisTxid)
        // console.log(`output: ${JSON.stringify(output, null, 2)}`)

        outAry.push(output)
      }

      res.status(200)
      return res.json(outAry)
    } catch (err) {
      wlogger.error('Error in slp.js/validate3Bulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/txDetails/{txid}  SLP transaction details.
   * @apiName SLP transaction details.
   * @apiGroup SLP
   * @apiDescription Transaction details on a token transfer.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/txDetails/8ab4ac5dea3f9024e3954ee5b61452955d659a34561f79ef62ac44e133d0980e" -H "accept:application/json"
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

      const options = _this.generateCredentialsGP()
      const opt = {
        method: 'get',
        baseURL: url,
        headers: options.headers,
        timeout: options.timeout
      }
      // Get token data from SLPDB
      const tokenRes = await _this.axios.request(opt)
      // console.log(`tokenRes: ${util.inspect(tokenRes)}`)

      // Return 'not found' error if both the confirmed and unconfirmed
      // collections are empty.
      if (tokenRes.data.c.length === 0 && tokenRes.data.u.length === 0) {
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
   * curl -X GET "https://api.fullstack.cash/v5/slp/tokenStats/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0" -H "accept:application/json"
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
   * curl -X GET "https://api.fullstack.cash/v5/slp/transactions/9ba379fe8171176d4e7e6771d9a24cd0e044c7b788d5f86a3fdf80904832b2c0/simpleledger:qrxa0unrn67rtn85v7asfddhhth43ecnxua0antk2l" -H "accept:application/json"
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
  generateCredentialsGP () {
    // Generate the Basic Authentication header for a private instance of SLPDB.
    const username = 'BITBOX'
    const password = SLPDB_PASS_GP
    const combined = `${username}:${password}`
    // console.log(`combined: ${combined}`)
    const base64Credential = Buffer.from(combined).toString('base64')
    const readyCredential = `Basic ${base64Credential}`

    const options = {
      headers: {
        authorization: readyCredential
      },
      timeout: 45000
    }

    return options
  }

  // Generates a Basic Authorization header for slpserve.
  generateCredentialsWL () {
    // Generate the Basic Authentication header for a private instance of SLPDB.
    const username = 'BITBOX'
    const password = SLPDB_PASS_WL
    const combined = `${username}:${password}`
    // console.log(`combined: ${combined}`)
    const base64Credential = Buffer.from(combined).toString('base64')
    const readyCredential = `Basic ${base64Credential}`

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
      return 1 // Making the linter happy
    })

    // Because you are not using Insight API indexer, you do not get the
    // sending addresses from an indexer or from the node.
    // However, they are available from the SLPDB output.
    const tokenInputs = transaction.in
    // Collect the input addresses
    const sendInputs = []
    for (let i = 0; i < tokenInputs.length; i += 1) {
      const tokenInput = tokenInputs[i]
      const sendInput = {}
      sendInput.address = tokenInput.e.a
      sendInputs.push(sendInput)
    }

    const obj = {
      tokenInfo: {
        versionType: transaction.slp.detail.versionType,
        tokenName: transaction.slp.detail.name,
        tokenTicker: transaction.slp.detail.symbol,
        transactionType: transaction.slp.detail.transactionType,
        tokenIdHex: transaction.slp.detail.tokenIdHex,
        sendOutputs: sendOutputs,
        sendInputsFull: sendInputs,
        sendOutputsFull: transaction.slp.detail.outputs
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
   * curl -X POST "https://api.fullstack.cash/v5/slp/generateSendOpReturn" -H "accept:application/json" -H "Content-Type: application/json" -d '{"tokenUtxos":[{"tokenId": "0a321bff9761f28e06a268b14711274bb77617410a16807bd0437ef234a072b1","decimals": 0, "tokenQty": 2}], "sendQty": 1.5}'
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

      // console.log('sendQty: ', sendQty)
      // console.log(`tokenUtxos: `, tokenUtxos)
      const opReturn = await _this.bchjs.SLP.TokenType1.generateSendOpReturn(
        tokenUtxos,
        sendQty
      )

      const script = opReturn.script.toString('hex')
      // console.log(`script: ${script}`)

      res.status(200)
      return res.json({ script, outputs: opReturn.outputs })
    } catch (err) {
      console.log('err: ', err)
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

  /**
   * @api {post} /slp/hydrateUtxos/ hydrateUtxos
   * @apiName SLP hydrateUtxos
   * @apiGroup SLP
   * @apiDescription Hydrate UTXO data with SLP information.
   *
   * Expects an array of UTXO objects as input. Returns an array of equal size.
   * Returns UTXO data hydrated with token information. If the UTXO does not
   * belong to a SLP transaction, it will return an isValid property set to
   * false. If the UTXO is part of an SLP transaction, it will return the UTXO
   * object with additional SLP information attached. An isValid property will
   * be included. If its value is true, the UTXO is a valid SLP UTXO. If the
   * value is null, then SLPDB has not yet processed that txid and validity has
   * not been confirmed.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v5/slp/hydrateUtxos" -H "accept:application/json" -H "Content-Type: application/json" -d '{"utxos":[{"utxos":[{"txid": "d56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56","vout": 3, "value": "6816", "height": 606848, "confirmations": 13, "satoshis": 6816}, {"txid": "d56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56","vout": 2, "value": "546", "height": 606848, "confirmations": 13, "satoshis": 546}]}]}'
   *
   *
   */
  async hydrateUtxos (req, res, next) {
    try {
      const utxos = req.body.utxos

      // Extract a delay value if the user passed it in.
      const usrObjIn = req.body.usrObj
      let utxoDelay = 0
      if (usrObjIn && usrObjIn.utxoDelay) {
        utxoDelay = usrObjIn.utxoDelay
      }

      // console.log('req: ', req)
      // console.log(`req._remoteAddress: ${req._remoteAddress}`)

      // Generate a user object that can be passed along with internal calls
      // from bch-js.
      const usrObj = {
        ip: req._remoteAddress,
        jwtToken: req.locals.jwtToken,
        proLimit: req.locals.proLimit,
        apiLevel: req.locals.apiLevel,
        utxoDelay
      }

      // Validate inputs
      if (!Array.isArray(utxos)) {
        res.status(422)
        return res.json({
          error: 'Input must be an array.'
        })
      }

      if (!utxos.length) {
        res.status(422)
        return res.json({
          error: 'Array should not be empty'
        })
      }

      if (utxos.length > 20) {
        res.status(422)
        return res.json({
          error: 'Array too long, max length is 20'
        })
      }

      if (!utxos[0].utxos) {
        res.status(422)
        return res.json({
          error: 'Each element in array should have a utxos property'
        })
      }

      // Loop through each address and query the UTXOs for that element.
      for (let i = 0; i < utxos.length; i++) {
        const theseUtxos = utxos[i].utxos

        // Get SLP token details.
        const details = await _this.bchjs.SLP.Utils.tokenUtxoDetails(
          theseUtxos,
          usrObj
        )
        // console.log('details: ', details)

        // Replace the original UTXO data with the hydrated data.
        utxos[i].utxos = details
      }

      res.status(200)
      return res.json({ slpUtxos: utxos })
    } catch (err) {
      wlogger.error('Error in slp.js/hydrateUtxos().', err)
      // console.error('Error in slp.js/hydrateUtxos().', err)

      // Decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      // console.log('msg: ', msg)
      // console.log('status: ', status)

      if (msg) {
        res.status(status)
        return res.json({ error: msg, message: msg, success: false })
      }

      res.status(500)
      return res.json({
        error: 'Undetermined error in hydrateUtxos()',
        message: err.message
      })
    }
  }

  /**
   * @api {post} /slp/hydrateUtxosWL/ hydrateUtxosWL
   * @apiName SLP hydrateUtxosWL
   * @apiGroup SLP
   * @apiDescription Hydrate UTXO data with SLP information, using only the whitelist SLPDB.
   *
   * This call is identical to `hydrateUtxos`, except it will only use the
   * filtered SLPDB with a whitelist. This results in faster performance, more
   * reliable uptime, but more frequent `isValid: null` values. Some use-cases
   * prioritize the speed and reliability over acceptance of a wide range of
   * SLP tokens.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v5/slp/hydrateUtxosWL" -H "accept:application/json" -H "Content-Type: application/json" -d '{"utxos":[{"utxos":[{"txid": "d56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56","vout": 3, "value": "6816", "height": 606848, "confirmations": 13, "satoshis": 6816}, {"txid": "d56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56","vout": 2, "value": "546", "height": 606848, "confirmations": 13, "satoshis": 546}]}]}'
   *
   *
   */
  async hydrateUtxosWL (req, res, next) {
    try {
      const utxos = req.body.utxos

      // Extract a delay value if the user passed it in.
      const usrObjIn = req.body.usrObj
      let utxoDelay = 0
      if (usrObjIn && usrObjIn.utxoDelay) {
        utxoDelay = usrObjIn.utxoDelay
      }

      // Generate a user object that can be passed along with internal calls
      // from bch-js.
      const usrObj = {
        ip: req._remoteAddress,
        jwtToken: req.locals.jwtToken,
        proLimit: req.locals.proLimit,
        apiLevel: req.locals.apiLevel,
        utxoDelay
      }

      // Validate inputs
      if (!Array.isArray(utxos)) {
        res.status(422)
        return res.json({
          error: 'Input must be an array.'
        })
      }

      if (!utxos.length) {
        res.status(422)
        return res.json({
          error: 'Array should not be empty'
        })
      }

      if (utxos.length > 20) {
        res.status(422)
        return res.json({
          error: 'Array too long, max length is 20'
        })
      }

      if (!utxos[0].utxos) {
        res.status(422)
        return res.json({
          error: 'Each element in array should have a utxos property'
        })
      }

      // Loop through each address and query the UTXOs for that element.
      for (let i = 0; i < utxos.length; i++) {
        const theseUtxos = utxos[i].utxos
        // console.log(`theseUtxos: ${JSON.stringify(theseUtxos, null, 2)}`)

        // Get SLP token details.
        const details = await _this.bchjs.SLP.Utils.tokenUtxoDetailsWL(
          theseUtxos,
          usrObj
        )
        // console.log('details : ', details)

        // Replace the original UTXO data with the hydrated data.
        utxos[i].utxos = details
      }

      res.status(200)
      return res.json({ slpUtxos: utxos })
    } catch (err) {
      wlogger.error('Error in slp.js/hydrateUtxosWL().', err)
      console.error('Error in slp.js/hydrateUtxosWL().', err)

      // Decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      console.log('msg: ', msg)
      console.log('status: ', status)
      if (msg) {
        res.status(status)
        return res.json({ error: msg, message: msg, success: false })
      }

      res.status(500)
      return res.json({
        error: 'Error in hydrateUtxosWL()',
        message: 'Error in hydrateUtxosWL()'
      })
    }
  }

  /**
   * @api {get} /slp/status Get the health status of SLPDB
   * @apiName Get the health status of SLPDB
   * @apiGroup SLP
   * @apiDescription Get the health status of SLPDB
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/status" -H "accept:application/json" -H "Content-Type: application/json"
   *
   */
  async getStatus (req, res, next) {
    try {
      const query = {
        v: 3,
        q: {
          db: ['s'],
          find: { context: 'SLPDB' },
          limit: 10
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

      const status = tokenRes.data.s[0]

      res.status(200)
      return res.json(status)
    } catch (err) {
      // console.log(err)
      wlogger.error('Error in slp.js/getStatus().', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/nftChildren/{tokenId} Get all NFT children for a given NFT group
   * @apiName Get all NFT children for a given NFT group
   * @apiGroup SLP
   * @apiDescription Get all NFT children for a given NFT group
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/nftChildren/68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a" -H "accept:application/json"
   *
   */
  async getNftChildren (req, res, next) {
    try {
      // Validate the input data.
      const tokenId = req.params.tokenId

      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const token = await _this.lookupToken(tokenId)
      // console.log(`token: ${JSON.stringify(token, null, 2)}`)

      if (!token || token.id === 'not found' || token.versionType !== 129) {
        res.status(400)
        return res.json({ error: 'NFT group does not exists' })
      }

      const query = {
        v: 3,
        q: {
          db: ['t'],
          aggregate: [
            { $match: { nftParentId: tokenId } },
            { $skip: 0 }, // TODO: pass start point
            { $limit: 100 } // TODO: pass count limit
          ]
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
      const childrenIds = []
      const childrenRes = await _this.axios.request(opt)
      // console.log(`childrenRes.data: ${JSON.stringify(childrenRes.data, null, 2)}`)
      if (!childrenRes || !childrenRes.data || !childrenRes.data.t) {
        res.status(400)
        return res.json({ error: 'No children data in the group' })
      }

      childrenRes.data.t.forEach(function (token) {
        // console.log(`info: ${JSON.stringify(token, null, 2)}`)
        if (
          token.tokenDetails.versionType === 65 &&
          token.tokenDetails.transactionType === 'GENESIS'
        ) {
          childrenIds.push(token.tokenDetails.tokenIdHex)
        }
      })

      res.status(200)
      return res.json({ nftChildren: childrenIds })
    } catch (err) {
      // console.log(err)
      wlogger.error('Error in slp.js/getNftChildren().', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {get} /slp/nftGroup/{tokenId} Get the NFT group for a given NFT child token
   * @apiName Get the NFT group for a given NFT child token
   * @apiGroup SLP
   * @apiDescription Get the NFT group for a given NFT child token
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v5/slp/nftGroup/45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9" -H "accept:application/json"
   *
   */
  async getNftGroup (req, res, next) {
    try {
      // Validate the input data.
      const tokenId = req.params.tokenId

      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({ error: 'tokenId can not be empty' })
      }

      const token = await _this.lookupToken(tokenId)
      // console.log(`token: ${JSON.stringify(token, null, 2)}`)

      if (
        !token ||
        token.id === 'not found' ||
        token.versionType !== 65 ||
        !token.nftParentId
      ) {
        res.status(400)
        return res.json({ error: 'NFT child does not exists' })
      }

      const parentToken = await _this.lookupToken(token.nftParentId)
      // console.log(`parentToken: ${JSON.stringify(token, null, 2)}`)
      if (
        !parentToken ||
        parentToken.id === 'not found' ||
        parentToken.versionType !== 129
      ) {
        res.status(400)
        return res.json({ error: 'NFT group does not exists' })
      }

      res.status(200)
      return res.json({ nftGroup: parentToken })
    } catch (err) {
      // console.log(err)
      wlogger.error('Error in slp.js/getNftGroup().', err)
      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Slp
