/*
  Blockbook API route
*/

'use strict'

const express = require('express')
const axios = require('axios')
const wlogger = require('../../util/winston-logging')

const RouteUtils = require('../../util/route-utils')
const routeUtils = new RouteUtils()

// Library for easily switching the API paths to use different instances of
// Blockbook.
const BlockbookPath = require('../../util/blockbook-path')
const BLOCKBOOKPATH = new BlockbookPath()
// BLOCKBOOKPATH.toOpenBazaar()

const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class Blockbook {
  constructor () {
    _this = this

    _this.axios = axios
    _this.routeUtils = routeUtils
    _this.bchjs = bchjs
    _this.BLOCKBOOKPATH = BLOCKBOOKPATH

    _this.router = router
    _this.router.get('/', _this.root)
    _this.router.get('/balance/:address', _this.balanceSingle)
    _this.router.post('/balance', _this.balanceBulk)
    _this.router.get('/utxos/:address', _this.utxosSingle)
    _this.router.post('/utxos', _this.utxosBulk)
    _this.router.get('/tx/:txid', _this.txSingle)
    _this.router.post('/tx', _this.txBulk)
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

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'address' })
  }

  // Query the Blockbook Node API for a balance on a single BCH address.
  // Returns a Promise.
  async balanceFromBlockbook (thisAddress) {
    try {
      // console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

      // Convert the address to a cashaddr without a prefix.
      const addr = _this.bchjs.Address.toCashAddress(thisAddress)

      const path = `${_this.BLOCKBOOKPATH.addrPath}${addr}`
      // console.log(`path: ${path}`)

      // Query the Blockbook Node API.
      const options = {
        method: 'get',
        baseURL: path
      }

      const axiosResponse = await _this.axios.request(options)
      const retData = axiosResponse.data
      // console.log(`retData: ${util.inspect(retData)}`)

      return retData
    } catch (err) {
      // Dev Note: Do not log error messages here. Throw them instead and let the
      // parent function handle it.
      wlogger.debug('Error in blockbook.js/balanceFromBlockbook()')
      throw err
    }
  }

  /**
   * @api {get} /blockbook/balance/{addr} Get balance for a single address.
   * @apiName Balance for a single address
   * @apiGroup Blockbook
   * @apiDescription Returns an object with balance and details about an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/blockbook/balance/bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async balanceSingle (req, res, next) {
    try {
      const address = req.params.address

      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      wlogger.debug(
        'Executing blockbook/balanceSingle with this address: ',
        address
      )

      // Ensure the input is a valid BCH address.
      try {
        // const legacyAddr = bchjs.Address.toLegacyAddress(address)
        _this.bchjs.Address.toLegacyAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      // Query the Blockbook Node API.
      const retData = await _this.balanceFromBlockbook(address)

      // Return the retrieved address information.
      res.status(200)
      return res.json(retData)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockbook.js/balanceSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockbook/balance Get balance for an array of addresses.
   * @apiName  Balance for an array of addresses
   * @apiGroup Blockbook
   * @apiDescription Return balances and details for an array of addresses.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/blockbook/balance" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf","bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf"]}'
   *
   *
   */
  // POST handler for bulk queries on address details
  async balanceBulk (req, res, next) {
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
        'Executing blockbook.js/balanceBulk with these addresses: ',
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
      addresses = addresses.map(async (address, index) =>
        // console.log(`address: ${address}`)
        _this.balanceFromBlockbook(address)
      )

      // Wait for all parallel Insight requests to return.
      const result = await _this.axios.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error('Error in blockbook.js/balanceBulk().', err)

      return _this.errorHandler(err, res)
    }
  }

  // Query the Blockbook API for utxos associated with a BCH address.
  // Returns a Promise.
  async utxosFromBlockbook (thisAddress) {
    try {
      // console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

      // Convert the address to a cashaddr without a prefix.
      const addr = _this.bchjs.Address.toCashAddress(thisAddress)

      const path = `${_this.BLOCKBOOKPATH.utxoPath}${addr}`
      // console.log(`path: ${path}`)

      // Query the Blockbook API.
      // Query the Blockbook Node API.
      const options = {
        method: 'get',
        baseURL: path
      }
      const axiosResponse = await _this.axios.request(options)
      const retData = axiosResponse.data
      // console.log(`retData: ${util.inspect(retData)}`)

      // Add the satoshis property to each UTXO.
      for (let i = 0; i < retData.length; i++) {
        retData[i].satoshis = Number(retData[i].value)
      }

      return retData
    } catch (err) {
      // Dev Note: Do not log error messages here. Throw them instead and let the
      // parent function handle it.
      wlogger.debug('Error in blockbook.js/utxosFromBlockbook()')
      throw err
    }
  }

  /**
   * @api {get} /blockbook/utxos/{addr} Get utxos for a single address.
   * @apiName UTXOs for a single address
   * @apiGroup Blockbook
   * @apiDescription Returns an object with UTXOs associated with an address.
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/blockbook/utxos/bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3" -H "accept: application/json"
   *
   */
  // GET handler for single balance
  async utxosSingle (req, res, next) {
    try {
      const address = req.params.address

      if (!address || address === '') {
        res.status(400)
        return res.json({ error: 'address can not be empty' })
      }

      // Reject if address is an array.
      if (Array.isArray(address)) {
        res.status(400)
        return res.json({
          error: 'address can not be an array. Use POST for bulk upload.'
        })
      }

      wlogger.debug(
        'Executing blockbook/utxosSingle with this address: ',
        address
      )

      // Ensure the input is a valid BCH address.
      try {
        // const legacyAddr = bchjs.Address.toLegacyAddress(address)
        _this.bchjs.Address.toLegacyAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = _this.routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error:
            'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
        })
      }

      // Query the Blockbook API.
      const retData = await _this.utxosFromBlockbook(address)

      // Return the retrieved address information.
      res.status(200)
      return res.json(retData)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockbook.js/utxosSingle().', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockbook/utxos Get UTXOs for an array of addresses.
   * @apiName  UTXOs for an array of addresses
   * @apiGroup Blockbook
   * @apiDescription Return UTXOs associate with an array of addresses.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/blockbook/utxos" -H "accept: application/json" -H "Content-Type: application/json" -d '{"addresses":["bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3","bitcoincash:qzy8wnj0dz927eu6kvh8v2pqsr5w8jh33ys757tdtq"]}'
   *
   *
   */
  // POST handler for bulk queries on address utxos
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
        'Executing blockbook.js/utxosBulk with these addresses: ',
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
      addresses = addresses.map(async (address, index) =>
        // console.log(`address: ${address}`)
        _this.utxosFromBlockbook(address)
      )

      // Wait for all parallel Insight requests to return.
      const result = await _this.axios.all(addresses)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error('Error in blockbook.js/utxosBulk().', err)
      return _this.errorHandler(err, res)
    }
  }

  // Query the Blockbook Node API for transactions on a single TXID.
  // Returns a Promise.
  async transactionsFromBlockbook (txid) {
    try {
      // console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

      const path = `${_this.BLOCKBOOKPATH.txPath}${txid}`
      // console.log(`path: ${path}`)

      // Query the Blockbook Node API.
      const options = {
        method: 'get',
        baseURL: path
      }
      const axiosResponse = await _this.axios.request(options)
      const retPromise = axiosResponse.data
      // console.log(`retData: ${util.inspect(retData)}`)

      return retPromise
    } catch (err) {
      // Dev Note: Do not log error messages here. Throw them instead and let the
      // parent function handle it.
      wlogger.debug('Error in blockbook.js/transactionsFromBlockbook()')
      throw err
    }
  }

  /**
   * @api {get} /blockbook/tx/{txid} Get details for a single transaction.
   * @apiName Details for a single transaction
   * @apiGroup Blockbook
   * @apiDescription Returns an object with details for a single transaction
   *
   *
   * @apiExample Example usage:
   * curl -X GET "https://api.fullstack.cash/v3/blockbook/tx/6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d" -H "accept: application/json"
   *
   */
  // GET handler for single transaction details.
  async txSingle (req, res, next) {
    try {
      const txid = req.params.txid

      if (!txid || txid === '') {
        res.status(400)
        return res.json({ error: 'txid can not be empty' })
      }

      // Reject if address is an array.
      if (Array.isArray(txid)) {
        res.status(400)
        return res.json({
          error: 'txid can not be an array. Use POST for bulk upload.'
        })
      }

      // TODO: Add regex comparison of txid to ensure it's valid.
      if (txid.length !== 64) {
        res.status(400)
        return res.json({
          error: `txid must be of length 64 (not ${txid.length})`
        })
      }

      wlogger.debug('Executing blockbook/txSingle with this txid: ', txid)

      // Query the Blockbook Node API.
      const retData = await _this.transactionsFromBlockbook(txid)

      // Return the retrieved address information.
      res.status(200)
      return res.json(retData)
    } catch (err) {
      // Write out error to error log.
      wlogger.error('Error in blockbook.js/txSingle().', err)

      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /blockbook/tx Get details for an array of transactions.
   * @apiName  Details for an array of transactions
   * @apiGroup Blockbook
   * @apiDescription Return details for an array of transactions.
   * Limited to 20 items per request.
   *
   * @apiExample Example usage:
   * curl -X POST "https://api.fullstack.cash/v3/blockbook/tx" -H "accept: application/json" -H "Content-Type: application/json" -d '{"txids":["6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d","6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d"]}'
   *
   *
   */
  // POST handler for bulk queries on tx details
  async txBulk (req, res, next) {
    try {
      let txids = req.body.txids
      // const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

      // Reject if txids is not an array.
      if (!Array.isArray(txids)) {
        res.status(400)
        return res.json({
          error: 'txids need to be an array. Use GET for single address.'
        })
      }

      // Enforce array size rate limits
      if (!_this.routeUtils.validateArraySize(req, txids)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: 'Array too large.'
        })
      }

      wlogger.debug('Executing blockbook.js/txBulk with these txids: ', txids)

      // Validate each element in the txids array.
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]

        if (!thisTxid || thisTxid === '') {
          res.status(400)
          return res.json({ error: 'txid can not be empty' })
        }

        // TODO: Add regex comparison of txid to ensure it's valid.
        if (thisTxid.length !== 64) {
          res.status(400)
          return res.json({
            error: `txid must be of length 64 (not ${thisTxid.length})`
          })
        }
      }

      // Loops through each address and creates an array of Promises, querying
      // Insight API in parallel.
      txids = txids.map(async (txid, index) =>
        // console.log(`address: ${address}`)
        _this.transactionsFromBlockbook(txid)
      )

      // Wait for all parallel Insight requests to return.
      const result = await _this.axios.all(txids)

      // Return the array of retrieved address information.
      res.status(200)
      return res.json(result)
    } catch (err) {
      wlogger.error('Error in blockbook.js/txBulk().', err)
      return _this.errorHandler(err, res)
    }
  }
}

module.exports = Blockbook
