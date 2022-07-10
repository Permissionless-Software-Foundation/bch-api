'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const BigNumber = require('bignumber.js')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

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

    _this.router = router

    _this.router.get('/', _this.root)
    _this.router.get('/convert/:address', _this.convertAddressSingle)
    _this.router.post('/convert', _this.convertAddressBulk)
    _this.router.get('/validateTxid2/:txid', _this.validate2Single)
    _this.router.get('/whitelist', _this.getSlpWhitelist)
    _this.router.post('/generateSendOpReturn', _this.generateSendOpReturn)
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
          tokenId: 'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479'
        },
        {
          name: 'SPICE',
          tokenId: '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf'
        },
        {
          name: 'PSF',
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
        },
        {
          name: 'TROUT',
          tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        },
        {
          name: 'PSFTEST',
          tokenId: 'd0ef4de95b78222bfee2326ab11382f4439aa0855936e2fe6ac129a8d778baa0'
        }
      ]

      res.status(200)
      return res.json(list)
    } catch (err) {
      wlogger.error('Error in slp.ts/whitelist().', err)

      return _this.errorHandler(err, res)
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
}

module.exports = Slp
