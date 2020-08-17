/*
  Electrum API route
*/

'use strict'

const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')
const bitcore = require('bitcore-lib-cash')

const ElectrumCash = require('electrum-cash').Client
// const ElectrumCash = require('/home/trout/work/personal/electrum-cash/electrum.js').Client // eslint-disable-line

const wlogger = require('../../util/winston-logging')
const config = require('../../../config')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class Electrum {
  constructor () {
    _this = this

    _this.config = config
    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    _this.bitcore = bitcore

    _this.electrumx = new ElectrumCash(
      'bch-api',
      '1.4.1',
      process.env.FULCRUM_URL,
      process.env.FULCRUM_PORT
      // '192.168.0.6',
      // '50002'
    )

    _this.isReady = false
    // _this.connectToServers()

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/utxos/:address', _this.getUtxos)
    _this.router.post('/utxos', _this.utxosBulk)
    _this.router.get('/tx/data/:address', _this.getTransactionDetails)
    _this.router.post('/tx/data', _this.transactionDetailsBulk)
    _this.router.get('/balance/:address', _this.getBalance)
    _this.router.post('/balance', _this.balanceBulk)
    _this.router.get('/transactions/:address', _this.getTransactions)
    _this.router.post('/transactions', _this.transactionsBulk)
    _this.router.get('/unconfirmed/:address', _this.getMempool)
    _this.router.post('/unconfirmed', _this.mempoolBulk)
  }

  // Initializes a connection to electrum servers.
  async connect () {
    try {
      console.log('Attempting to connect to ElectrumX server...')

      // console.log('_this.electrumx: ', _this.electrumx)

      // Return immediately if a connection has already been established.
      if (_this.isReady) return true

      // Connect to the server.
      await _this.electrumx.connect()

      // Set the connection flag.
      _this.isReady = true

      console.log('...Successfully connected to ElectrumX server.')

      // console.log(`_this.isReady: ${_this.isReady}`)
      return _this.isReady
    } catch (err) {
      console.log('err: ', err)
      wlogger.error('Error in electrumx.js/connect(): ', err)
      // throw err
    }
  }

  // Disconnect from the ElectrumX server.
  async disconnect () {
    try {
      // Return immediately if the isReady flag is false.
      if (!_this.isReady) return true

      // Disconnect from the server.
      await _this.electrumx.disconnect()

      // Clear the isReady flag.
      _this.isReady = false

      // Return true to signal that the disconnection happened successfully.
      return true
    } catch (err) {
      // console.log(`err: `, err)
      wlogger.error('Error in electrumx.js/disconnect()')
      throw err
    }
  }

  // DRY error handler.
  errorHandler (err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Handle error patterns specific to this route.
    if (err.message) {
      res.status(400)
      return res.json({ success: false, error: err.message })
    }

    // If error can be handled, return the stack trace
    res.status(500)
    return res.json({ error: util.inspect(err) })
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'electrumx' })
  }

  // Returns a promise that resolves to UTXO data for an address. Expects input
  // to be a cash address, and input validation to have already been done by
  // parent, calling function.
  async _utxosFromElectrumx (address) {
    try {
      // Convert the address to a scripthash.
      const scripthash = _this.addressToScripthash(address)

      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the utxos from the ElectrumX server.
      const electrumResponse = await _this.electrumx.request(
        'blockchain.scripthash.listunspent',
        scripthash
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      return electrumResponse
    } catch (err) {
      // console.log('err: ', err)

      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/_utxosFromElectrumx(): ', err)
      throw err
    }
  }

  /**
   * @api {get} /electrumx/utxos/{addr} Get utxos for a single address.
   * @apiName UTXOs for a single address
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an object with UTXOs associated with an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/electrumx/utxos/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async getUtxos (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      const cashAddr = _this.bchjs.Address.toCashAddress(address)

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      wlogger.debug(
        'Executing electrumx/getUtxos with this address: ',
        cashAddr
      )

      // Get data from ElectrumX server.
      const electrumResponse = await _this._utxosFromElectrumx(cashAddr)
      // console.log(`_utxosFromElectrumx(): ${JSON.stringify(electrumResponse, null, 2)}`)

      // Pass the error message if ElectrumX reports an error.
      if (Object.prototype.hasOwnProperty.call(electrumResponse, 'code')) {
        res.status(400)
        return res.json({
          success: false,
          message: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        utxos: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getUtxos().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /electrumx/utxo Get utxos for an array of addresses.
   * @apiName  UTXOs for an array of addresses
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of objects with UTXOs associated with an address.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/electrumx/utxos" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
   *
   *
   */
  // POST handler for bulk queries on address details
  async utxosBulk (req, res, next) {
    try {
      let addresses = req.body.addresses
      // const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

      // Reject if addresses is not an array.
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

      wlogger.debug(
        'Executing electrumx.js/utxoBulk with these addresses: ',
        addresses
      )

      // Validate each element in the address array.
      for (let i = 0; i < addresses.length; i++) {
        const thisAddress = addresses[i]

        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.Address.toLegacyAddress(thisAddress)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const networkIsValid = _this.routeUtils.validateNetwork(thisAddress)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
          })
        }
      }

      // Loops through each address and creates an array of Promises, querying
      // Insight API in parallel.
      addresses = addresses.map(async (address, index) => {
        // console.log(`address: ${address}`)
        const utxos = await _this._utxosFromElectrumx(address)

        return {
          utxos,
          address
        }
      })

      // Wait for all parallel Insight requests to return.
      const result = await Promise.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json({
        success: true,
        utxos: result
      })
    } catch (err) {
      wlogger.error('Error in electrumx.js/utxoBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a promise that resolves to transaction details data for a txid.
  // Expects input to be a txid string, and input validation to have already
  // been done by parent, calling function.
  async _transactionDetailsFromElectrum (txid, verbose = true) {
    try {
      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the utxos from the ElectrumX server.
      const electrumResponse = await _this.electrumx.request(
        'blockchain.transaction.get',
        txid,
        verbose
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      return electrumResponse
    } catch (err) {
      // console.log('err: ', err)

      // Write out error to error log.
      wlogger.error(
        'Error in elecrumx.js/_transactionDetailsFromElectrum(): ',
        err
      )
      throw err
    }
  }

  /**
   * @api {get} /electrumx/tx/data/{txid} Get transaction details for a TXID
   * @apiName transaction details for a TXID
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an object with transaction details of the TXID
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/electrumx/tx/data/a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d" -H "accept: application/json"
   *
   */
  // GET handler for single transaction
  async getTransactionDetails (req, res, next) {
    try {
      const txid = req.params.txid
      const verbose = req.query.verbose

      // Reject if txid is anything other than a string
      if (typeof txid !== 'string') {
        res.status(400)
        return res.json({
          success: false,
          error: 'txid must be a string'
        })
      }

      wlogger.debug(
        'Executing electrumx/getTransactionDetails with this txid: ',
        txid
      )

      // Get data from ElectrumX server.
      const electrumResponse = await _this._transactionDetailsFromElectrum(
        txid,
        verbose
      )
      // console.log(`_transactionDetailsFromElectrum(): ${JSON.stringify(electrumResponse, null, 2)}`)

      // Pass the error message if ElectrumX reports an error.
      if (electrumResponse instanceof Error) {
        res.status(400)
        return res.json({
          success: false,
          error: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        details: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getTransactionDetails().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /electrumx/tx/data Get transaction details for an array of TXIDs
   * @apiName  Transaction details for an array of TXIDs
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of objects with transaction details of an array of TXIDs.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/electrumx/tx/data" -H "accept: application/json" -H "Content-Type: application/json" -d '{"txids":["a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d","a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d"], "verbose":false}'
   *
   *
   */
  // POST handler for bulk queries on transaction details
  async transactionDetailsBulk (req, res, next) {
    try {
      const txids = req.body.txids
      const verbose = req.body.verbose || true

      // Reject if txids is not an array.
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'txids needs to be an array. Use GET for single txid.'
        })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, txids)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          success: false,
          error: 'Array too large.'
        })
      }

      wlogger.debug(
        'Executing electrumx.js/transactionDetailsBulk with these txids: ',
        txids
      )

      // Loops through each address and creates an array of Promises, querying
      // the Electrum server in parallel.
      const transactions = txids.map(async (txid, index) => {
        // console.log(`address: ${address}`)
        const details = await _this._transactionDetailsFromElectrum(
          txid,
          verbose
        )

        return { details, txid }
      })

      // Wait for all parallel Electrum requests to return.
      const result = await Promise.all(transactions)

      // Return the array of retrieved transaction details.
      res.status(200)
      return res.json({
        success: true,
        transactions: result
      })
    } catch (err) {
      wlogger.error('Error in electrumx.js/transactionDetailsBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a promise that resolves to a balance for an address. Expects input
  // to be a cash address, and input validation to have already been done by
  // parent, calling function.
  async _balanceFromElectrumx (address) {
    try {
      // Convert the address to a scripthash.
      const scripthash = _this.addressToScripthash(address)

      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the address balance from the ElectrumX server.
      const electrumResponse = await _this.electrumx.request(
        'blockchain.scripthash.get_balance',
        scripthash
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      return electrumResponse
    } catch (err) {
      // console.log('err1: ', err)

      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/_utxosFromElectrumx(): ', err)
      throw err
    }
  }

  /**
   * @api {get} /electrumx/balance/{addr} Get balance for a single address.
   * @apiName Balance for a single address
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an object with confirmed and unconfirmed balance associated with an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/electrumx/balance/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async getBalance (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      // Ensure the address is in cash address format.
      const cashAddr = _this.bchjs.Address.toCashAddress(address)

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      wlogger.debug(
        'Executing electrumx/getBalance with this address: ',
        cashAddr
      )

      // Get data from ElectrumX server.
      const electrumResponse = await _this._balanceFromElectrumx(cashAddr)
      // console.log(`_utxosFromElectrumx(): ${JSON.stringify(electrumResponse, null, 2)}`)

      // Pass the error message if ElectrumX reports an error.
      if (Object.prototype.hasOwnProperty.call(electrumResponse, 'code')) {
        res.status(400)
        return res.json({
          success: false,
          message: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        balance: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getBalance().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /electrumx/balance Get balances for an array of addresses.
   * @apiName  Balances for an array of addresses
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of balanes associated with an array of address.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/electrumx/balance" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
   *
   *
   */
  // POST handler for bulk queries on address balance
  async balanceBulk (req, res, next) {
    try {
      let addresses = req.body.addresses

      // Reject if addresses is not an array.
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

      wlogger.debug(
        'Executing electrumx.js/balanceBulk with these addresses: ',
        addresses
      )

      // Validate each element in the address array.
      for (let i = 0; i < addresses.length; i++) {
        const thisAddress = addresses[i]

        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.Address.toLegacyAddress(thisAddress)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const networkIsValid = _this.routeUtils.validateNetwork(thisAddress)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
          })
        }
      }

      // Loops through each address and creates an array of Promises, querying
      // ElectrumX API in parallel.
      addresses = addresses.map(async (address, index) => {
        // console.log(`address: ${address}`)
        const balance = await _this._balanceFromElectrumx(address)

        return {
          balance,
          address
        }
      })

      // Wait for all parallel Insight requests to return.
      const result = await Promise.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json({
        success: true,
        balances: result
      })
    } catch (err) {
      wlogger.error('Error in electrumx.js/balanceBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a promise that resolves an array of transaction history for an
  // address. Expects input to be a cash address, and input validation to have
  // already been done by parent, calling function.
  async _transactionsFromElectrumx (address) {
    try {
      // Convert the address to a scripthash.
      const scripthash = _this.addressToScripthash(address)

      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the address transaction history from the ElectrumX server.
      const electrumResponse = await _this.electrumx.request(
        'blockchain.scripthash.get_history',
        scripthash
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      return electrumResponse
    } catch (err) {
      // console.log('err1: ', err)

      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/_transactionsFromElectrumx(): ', err)
      throw err
    }
  }

  /**
   * @api {get} /electrumx/transactions/{addr} Get transaction history for a single address.
   * @apiName Transaction history for a single address
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of historical transactions associated with an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/electrumx/transactions/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async getTransactions (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      // Ensure the address is in cash address format.
      const cashAddr = _this.bchjs.Address.toCashAddress(address)

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      wlogger.debug(
        'Executing electrumx/getTransactions with this address: ',
        cashAddr
      )

      // Get data from ElectrumX server.
      const electrumResponse = await _this._transactionsFromElectrumx(cashAddr)
      // console.log(`_utxosFromElectrumx(): ${JSON.stringify(electrumResponse, null, 2)}`)

      // Pass the error message if ElectrumX reports an error.
      if (Object.prototype.hasOwnProperty.call(electrumResponse, 'code')) {
        res.status(400)
        return res.json({
          success: false,
          message: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        transactions: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getTransactions().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /electrumx/transactions Get the transaction history for an array of addresses.
   * @apiName  Transactions for an array of addresses
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of transactions associated with an array of address.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/electrumx/transactions" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
   *
   *
   */
  // POST handler for bulk queries on transaction histories for addresses.
  async transactionsBulk (req, res, next) {
    try {
      let addresses = req.body.addresses

      // Reject if addresses is not an array.
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

      wlogger.debug(
        'Executing electrumx.js/transactionsBulk with these addresses: ',
        addresses
      )

      // Validate each element in the address array.
      for (let i = 0; i < addresses.length; i++) {
        const thisAddress = addresses[i]

        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.Address.toLegacyAddress(thisAddress)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const networkIsValid = _this.routeUtils.validateNetwork(thisAddress)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
          })
        }
      }

      // Loops through each address and creates an array of Promises, querying
      // ElectrumX API in parallel.
      addresses = addresses.map(async (address, index) => {
        // console.log(`address: ${address}`)
        const transactions = await _this._transactionsFromElectrumx(address)

        return {
          transactions,
          address
        }
      })

      // Wait for all parallel Insight requests to return.
      const result = await Promise.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json({
        success: true,
        transactions: result
      })
    } catch (err) {
      wlogger.error('Error in electrumx.js/transactionsBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Returns a promise that resolves to unconfirmed UTXO data (mempool) for an address.
  // Expects input to be a cash address, and input validation to have
  // already been done by parent, calling function.
  async _mempoolFromElectrumx (address) {
    try {
      // Convert the address to a scripthash.
      const scripthash = _this.addressToScripthash(address)

      if (!_this.isReady) {
        throw new Error(
          'ElectrumX server connection is not ready. Call await connectToServer() first.'
        )
      }

      // Query the unconfirmed utxos from the ElectrumX server.
      const electrumResponse = await _this.electrumx.request(
        'blockchain.scripthash.get_mempool',
        scripthash
      )
      // console.log(
      //   `electrumResponse: ${JSON.stringify(electrumResponse, null, 2)}`
      // )

      return electrumResponse
    } catch (err) {
      // console.log('err: ', err)

      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/_mempoolFromElectrumx(): ', err)
      throw err
    }
  }

  /**
   * @api {get} /electrumx/unconfirmed/{addr} Get unconfirmed utxos for a single address.
   * @apiName Unconfirmed UTXOs for a single address
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an object with unconfirmed UTXOs associated with an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/electrumx/unconfirmed/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async getMempool (req, res, next) {
    try {
      const address = req.params.address

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      // Ensure the address is in cash address format.
      const cashAddr = _this.bchjs.Address.toCashAddress(address)

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          success: false,
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      wlogger.debug(
        'Executing electrumx/getMempool with this address: ',
        cashAddr
      )

      // Get data from ElectrumX server.
      const electrumResponse = await _this._mempoolFromElectrumx(cashAddr)
      // console.log(`_mempoolFromElectrumx(): ${JSON.stringify(electrumResponse, null, 2)}`)

      // Pass the error message if ElectrumX reports an error.
      if (Object.prototype.hasOwnProperty.call(electrumResponse, 'code')) {
        res.status(400)
        return res.json({
          success: false,
          message: electrumResponse.message
        })
      }

      res.status(200)
      return res.json({
        success: true,
        utxos: electrumResponse
      })
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in elecrumx.js/getMempool().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /electrumx/unconfirmed Get unconfirmed utxos for an array of addresses.
   * @apiName  Unconfirmed UTXOs for an array of addresses
   * @apiGroup ElectrumX / Fulcrum
   * @apiDescription Returns an array of objects with unconfirmed UTXOs associated with an address.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/electrumx/unconfirmed" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
   *
   *
   */
  // POST handler for bulk queries on address details
  async mempoolBulk (req, res, next) {
    try {
      let addresses = req.body.addresses

      // Reject if addresses is not an array.
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

      wlogger.debug(
        'Executing electrumx.js/mempoolBulk with these addresses: ',
        addresses
      )

      // Validate each element in the address array.
      for (let i = 0; i < addresses.length; i++) {
        const thisAddress = addresses[i]

        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.Address.toLegacyAddress(thisAddress)
        } catch (err) {
          res.status(400)
          return res.json({
            error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const networkIsValid = _this.routeUtils.validateNetwork(thisAddress)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
          })
        }
      }

      // Loops through each address and creates an array of Promises, querying
      // Insight API in parallel.
      addresses = addresses.map(async (address, index) => {
        // console.log(`address: ${address}`)
        const utxos = await _this._mempoolFromElectrumx(address)

        return {
          utxos,
          address
        }
      })

      // Wait for all parallel Insight requests to return.
      const result = await Promise.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json({
        success: true,
        utxos: result
      })
    } catch (err) {
      wlogger.error('Error in electrumx.js/mempoolBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Convert a 'bitcoincash:...' address to a script hash used by ElectrumX.
  addressToScripthash (addrStr) {
    try {
      // console.log(`addrStr: ${addrStr}`)

      const address = _this.bitcore.Address.fromString(addrStr)
      // console.log(`address: ${address}`)

      const script = _this.bitcore.Script.buildPublicKeyHashOut(address)
      // console.log(`script: ${script}`)

      const scripthash = _this.bitcore.crypto.Hash.sha256(script.toBuffer())
        .reverse()
        .toString('hex')
      // console.log(`scripthash: ${scripthash}`)

      return scripthash
    } catch (err) {
      wlogger.error('Error in electrumx.js/addressToScripthash()')
      throw err
    }
  }
}

module.exports = Electrum
