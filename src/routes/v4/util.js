'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const wlogger = require('../../util/winston-logging')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()
// const BCHJS_TESTNET = 'https://testnet.bchjs.cash/v4/'

// const bchjsHTTP = axios.create({
//   baseURL: process.env.RPC_BASEURL
// })

// const username = process.env.RPC_USERNAME
// const password = process.env.RPC_PASSWORD

// const requestConfig = {
//   method: 'post',
//   auth: {
//     username: username,
//     password: password
//   },
//   data: {
//     jsonrpc: '1.0'
//   }
// }

let _this

class UtilRoute {
  constructor (utilConfig) {
    this.bchjs = bchjs
    // this.blockbook = blockbook

    if (!utilConfig) {
      throw new Error(
        'Must pass a config object when instantiating the Util library.'
      )
    }
    if (!utilConfig.electrumx) {
      throw new Error(
        'Must pass an instance of Electrumx when instantiating the Util library.'
      )
    }

    this.electrumx = utilConfig.electrumx

    this.router = router
    this.router.get('/', this.root)
    this.router.get('/validateAddress/:address', this.validateAddressSingle)
    this.router.post('/validateAddress', this.validateAddressBulk)
    this.router.post('/sweep', this.sweepWif)

    _this = this
  }

  root (req, res, next) {
    return res.json({ status: 'util' })
  }

  /**
   * @api {get} /util/validateAddress/{address}  Get information about single bitcoin cash address.
   * @apiName Information about single bitcoin cash address
   * @apiGroup Util
   * @apiDescription Returns information about single bitcoin cash address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v4/util/validateAddress/bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c" -H "accept: application/json"
   *
   *
   */
  async validateAddressSingle (req, res, next) {
    try {
      const address = req.params.address
      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      const {
        BitboxHTTP,
        // username,
        // password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = 'validateaddress'
      requestConfig.data.method = 'validateaddress'
      requestConfig.data.params = [address]

      const response = await BitboxHTTP(requestConfig)

      return res.json(response.data.result)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      wlogger.error('Error in util.ts/validateAddressSingle().', err)

      res.status(500)
      return res.json({ error: util.inspect(err) })
    }
  }

  /**
   * @api {post} /util/validateAddress  Get information about bulk bitcoin cash addresses..
   * @apiName Information about bulk bitcoin cash addresses.
   * @apiGroup Util
   * @apiDescription Returns information about bulk bitcoin cash addresses..
   *
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v4/util/validateAddress" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c","bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"]}'
   * curl -X POST "https://api.fullstack.cash/v4/util/validateAddress" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c","bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"],"from": 1, "to": 5}'
   *
   *
   */
  async validateAddressBulk (req, res, next) {
    try {
      const addresses = req.body.addresses

      // Reject if addresses is not an array.
      if (!Array.isArray(addresses)) {
        res.status(400)
        return res.json({
          error: 'addresses needs to be an array. Use GET for single address.'
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, addresses)) {
        res.status(400) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      // Validate each element in the array.
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]

        // Ensure the input is a valid BCH address.
        try {
          bchjs.Address.toLegacyAddress(address)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${address}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const networkIsValid = routeUtils.validateNetwork(address)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error:
              'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
          })
        }
      }

      wlogger.debug('Executing util/validate with these addresses: ', addresses)

      const {
        BitboxHTTP,
        // username,
        // password,
        requestConfig
      } = routeUtils.setEnvVars()

      // Loop through each address and creates an array of requests to call in parallel
      const promises = addresses.map(async (address) => {
        requestConfig.data.id = 'validateaddress'
        requestConfig.data.method = 'validateaddress'
        requestConfig.data.params = [address]

        return BitboxHTTP(requestConfig)
      })

      // Wait for all parallel Insight requests to return.
      const axiosResult = await axios.all(promises)

      // Retrieve the data part of the result.
      const result = axiosResult.map((x) => x.data.result)

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      wlogger.error('Error in util.ts/validateAddressSingle().', err)

      res.status(500)
      return res.json({ error: util.inspect(err) })
    }
  }

  /**
   * @api {post} /util/sweep  Sweep BCH and tokens
   * @apiName Sweep BCH and tokens from a paper wallet
   * @apiGroup Util
   * @apiDescription This function can be used to check the BCH balance of a
   * paper wallet. It can also be used to sweep BCH and tokens from a paper
   * wallet and send them to a destination address.
   *
   * Note: It does not yet support multiple token classes on the same paper wallet.
   *
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v4/util/sweep" -H "accept: application/json" -H "Content-Type: application/json" -d '{"wif":"Kz52sdXLAiKtH82iAFRi6aTZanWtW5Eyv37KWdpY6tTv7pjoHste", "balanceOnly": true}'
   * curl -X POST "https://api.fullstack.cash/v4/util/sweep" -H "accept: application/json" -H "Content-Type: application/json" -d '{"wif":"Kz52sdXLAiKtH82iAFRi6aTZanWtW5Eyv37KWdpY6tTv7pjoHste", "toAddr": "bitcoincash:qpt8m4kqu963geedyrur6pdggqmv5kxwnq0rn322qu"}'
   *
   *
   */

  async sweepWif (req, res, next) {
    try {
      // Validate input
      const wif = req.body.wif
      const toAddr = req.body.toAddr
      const balanceOnly = req.body.balanceOnly

      if (typeof wif !== 'string' || wif.length !== 52) {
        res.status(400)
        return res.json({
          error: 'WIF needs to a proper compressed WIF starting with K or L'
        })
      }

      if (!balanceOnly) {
        // Only throw error if balanceOnly is false or undefined.
        if (!toAddr || toAddr === '') {
          res.status(400)
          return res.json({ error: 'address can not be empty' })
        }
      }

      wlogger.debug('Executing util/sweepWif with this address: ', toAddr)

      // Generate a private and public key pair from the WIF.
      const ecPair = bchjs.ECPair.fromWIF(wif)
      const fromAddr = bchjs.ECPair.toCashAddress(ecPair)

      // Get a balance on the public address
      const balances = await _this.electrumx._balanceFromElectrumx(fromAddr)
      // console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      // Total balance is the sum of the confirmed and unconfirmed balance.
      const totalBalance = balances.confirmed + balances.unconfirmed

      // Exit if balance is zero.
      if (isNaN(totalBalance) || totalBalance === 0) {
        res.status(422)
        return res.json({ error: 'No balance found at BCH address.' })
      }

      // Exit if this is a balance-only call.
      if (balanceOnly) {
        res.status(200)
        return res.json(totalBalance)
      }

      // Get all UTXOs help by the address.
      const utxos = await _this.electrumx._utxosFromElectrumx(fromAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      const tokenUtxos = []
      const bchUtxos = []

      // Exit if there are no UTXOs.
      if (utxos.length === 0) {
        res.status(422)
        return res.json({ error: 'No utxos found.' })
      }

      // Figure out which UTXOs are associated with SLP tokens.
      const isTokenUtxo = await _this.bchjs.SLP.Utils.tokenUtxoDetails(utxos)
      // console.log(`isTokenUtxo: ${JSON.stringify(isTokenUtxo, null, 2)}`)

      // Separate the bch and token UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        // Filter based on isTokenUtxo.
        if (!isTokenUtxo[i]) bchUtxos.push(utxos[i])
        else tokenUtxos.push(isTokenUtxo[i])
      }
      // console.log(
      //   `bchUtxos.length: ${bchUtxos.length}, tokenUtxos.length: ${tokenUtxos.length}`
      // )

      // Throw error if no BCH to move tokens.
      if (bchUtxos.length === 0 && tokenUtxos.length > 0) {
        res.status(422)
        return res.json({
          error:
            'Tokens found, but no BCH UTXOs found. Add BCH to wallet to move tokens.'
        })
      }

      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      const options = {
        ecPair,
        utxos,
        fromAddr,
        toAddr,
        bchUtxos,
        tokenUtxos
      }

      let hex

      // Choose the sweeping algorithm, based on if there are tokens or not.
      if (tokenUtxos.length === 0) hex = await _this._sweepBCH(options)
      else hex = await _this._sweepTokens(options, bchUtxos, tokenUtxos)
      // console.log(`hex: ${hex}`)

      // Throw error if there is more than one token class.

      // Generate a transaction to move tokens and BCH.

      // Broadcast the transaction.
      const txid = _this.bchjs.RawTransactions.sendRawTransaction([hex])

      res.status(200)
      return res.json(txid)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      // Catch the specific case of multiple tokens.
      if (
        err.message &&
        err.message.indexOf('Multiple token classes detected') > -1
      ) {
        res.status(422)
        return res.json({ error: err.message })
      }

      wlogger.error('Error in util.js/sweepWif().', err)
      console.error('Error in util.js/sweepWif().', err)

      res.status(500)
      return res.json({ error: err.message })
    }
  }

  // Sweep BCH only from a private WIF.
  async _sweepBCH (options) {
    try {
      // const wif = flags.wif
      // const toAddr = flags.address

      const ecPair = options.ecPair
      const toAddr = options.toAddr

      // const fromAddr = this.BITBOX.ECPair.toCashAddress(ecPair)
      //
      // // Get the UTXOs for that address.
      // let utxos = await this.BITBOX.Blockbook.utxo(fromAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      let utxos = options.utxos

      // Ensure all utxos have the satoshis property.
      utxos = utxos.map((x) => {
        x.satoshis = Number(x.value)
        return x
      })
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // instance of transaction builder
      let transactionBuilder
      if (options.testnet) {
        transactionBuilder = new _this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new _this.bchjs.TransactionBuilder()

      let originalAmount = 0

      // Loop through all UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        originalAmount = originalAmount + utxo.value

        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      }

      if (originalAmount < 546) {
        throw new Error(
          'Original amount less than the dust limit. Not enough BCH to send.'
        )
      }

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = _this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: utxos.length },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        _this.bchjs.Address.toLegacyAddress(toAddr),
        sendAmount
      )

      // Loop through each input and sign
      let redeemScript
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        transactionBuilder.sign(
          i,
          ecPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      return hex
    } catch (err) {
      wlogger.error('Error in util.js/sweepBCH().')
      throw err
    }
  }

  // Sweep BCH and tokens from a WIF.
  async _sweepTokens (options) {
    try {
      // const { ecPair, utxos, fromAddr, toAddr, bchUtxos, tokenUtxos } = options
      const { ecPair, utxos, toAddr, bchUtxos, tokenUtxos } = options

      // Input validation
      if (!Array.isArray(bchUtxos) || bchUtxos.length === 0) {
        throw new Error('bchUtxos need to be an array with one UTXO.')
      }
      if (!Array.isArray(tokenUtxos) || tokenUtxos.length === 0) {
        throw new Error('tokenUtxos need to be an array with one UTXO.')
      }

      // if (flags.testnet)
      //   this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })

      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      // Ensure there is only one class of token in the wallet. Throw an error if
      // there is more than one.
      const tokenId = tokenUtxos[0].tokenId
      const otherTokens = tokenUtxos.filter((x) => x.tokenId !== tokenId)
      if (otherTokens.length > 0) {
        throw new Error(
          'Multiple token classes detected. This function only supports a single class of token.'
        )
      }

      // instance of transaction builder
      let transactionBuilder
      if (options.testnet) {
        transactionBuilder = new _this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new _this.bchjs.TransactionBuilder()

      // Combine all the UTXOs into a single array.
      const allUtxos = utxos
      // console.log(`allUtxos: ${JSON.stringify(allUtxos, null, 2)}`)

      // Loop through all UTXOs.
      let originalAmount = 0
      for (let i = 0; i < allUtxos.length; i++) {
        const utxo = allUtxos[i]

        originalAmount = originalAmount + utxo.value

        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      }

      if (originalAmount < 300) {
        throw new Error(
          'Not enough BCH to send. Send more BCH to the wallet to pay miner fees.'
        )
      }

      // get byte count to calculate fee. paying 1 sat
      // Note: This may not be totally accurate. Just guessing on the byteCount size.
      // const byteCount = this.BITBOX.BitcoinCash.getByteCount(
      //   { P2PKH: 3 },
      //   { P2PKH: 5 }
      // )
      // //console.log(`byteCount: ${byteCount}`)
      // const satoshisPerByte = 1.1
      // const txFee = Math.floor(satoshisPerByte * byteCount)
      // console.log(`txFee: ${txFee} satoshis\n`)
      const txFee = 500

      // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
      const remainder = originalAmount - txFee - 546
      if (remainder < 1) {
        throw new Error('Selected UTXO does not have enough satoshis')
      }
      // console.log(`remainder: ${remainder}`)

      // Tally up the quantity of tokens
      let tokenQty = 0
      for (let i = 0; i < tokenUtxos.length; i++) {
        tokenQty += tokenUtxos[i].tokenQty
      }
      // console.log(`tokenQty: ${tokenQty}`)

      // Generate the OP_RETURN entry for an SLP SEND transaction.
      // console.log(`Generating op-return.`)
      const {
        script,
        outputs
      } = _this.bchjs.SLP.TokenType1.generateSendOpReturn(tokenUtxos, tokenQty)
      // console.log(`token outputs: ${outputs}`)

      // Since we are sweeping all tokens from the WIF, there generateOpReturn()
      // function should only compute 1 token output. If it returns 2, then there
      // is something unexpected happening.
      if (outputs > 1) {
        throw new Error(
          'More than one class of token detected. Sweep feature not supported.'
        )
      }

      // Add OP_RETURN as first output.
      const data = _this.bchjs.Script.encode(script)
      transactionBuilder.addOutput(data, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        _this.bchjs.Address.toLegacyAddress(toAddr),
        546
      )

      // Last output: send remaining BCH
      transactionBuilder.addOutput(
        _this.bchjs.Address.toLegacyAddress(toAddr),
        remainder
      )
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      // Sign each UTXO being consumed.
      let redeemScript
      for (let i = 0; i < allUtxos.length; i++) {
        const thisUtxo = allUtxos[i]
        // console.log(`thisUtxo: ${JSON.stringify(thisUtxo, null, 2)}`)

        transactionBuilder.sign(
          i,
          ecPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          thisUtxo.value
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`Transaction raw hex: `)
      // console.log(hex)

      return hex
    } catch (err) {
      wlogger.error('Error in util.js/sweepBCH().')
      throw err
    }
  }
}

module.exports = UtilRoute
