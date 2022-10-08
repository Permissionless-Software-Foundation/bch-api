/*
  Routes for interacting with the psf-slp-indexer
*/

// Public npm libraries
const express = require('express')
const router = express.Router()
const axios = require('axios')
const util = require('util')
const BCHJS = require('@psf/bch-js')
const SlpWallet = require('minimal-slp-wallet')
const SlpTokenMedia = require('slp-token-media')

// Local libraries
const RouteUtils = require('../../util/route-utils')
const config = require('../../../config')

const routeUtils = new RouteUtils()
const bchjs = new BCHJS({ restURL: config.restURL })

let _this

class PsfSlpIndexer {
  constructor () {
    // Encapsulate dependencies
    this.axios = axios
    this.router = router
    this.routeUtils = routeUtils
    this.config = config
    this.bchjs = bchjs

    // Define routes
    this.router.get('/', this.root)
    this.router.get('/status', this.getStatus)
    this.router.post('/address', this.getAddress)
    this.router.post('/txid', this.getTxid)
    this.router.post('/token', this.getTokenStats)
    this.router.post('/token/data', this.getTokenData)
    this.router.post('/token/data2', this.getTokenData2)

    // Encapsulate dependencies
    this.wallet = new SlpWallet(undefined, {
      restURL: config.restURL,
      interface: 'rest-api'
    })
    this.slpTokenMedia = null // placeholder

    this.initialize()

    _this = this
  }

  // This is an async function that is kicked off by the constructor at startup.
  // it is a way to initialize the libraries that have an async component, and
  // so can not be loaded in the constructor.
  async initialize () {
    // Wait for the wallet to initialize.
    await this.wallet.walletInfoPromise

    this.slpTokenMedia = new SlpTokenMedia({
      wallet: this.wallet,
      ipfsGatewayUrl: this.config.ipfsGateway
    })
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root (req, res, next) {
    return res.json({ status: 'psf-slp-indexer' })
  }

  /**
   * @api {get} /psf/slp/status/  Indexer Status.
   * @apiName SLP indexer status.
   * @apiGroup PSF SLP
   * @apiDescription Return SLP  indexer status
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:3000/v5/psf/slp/status
   *
   *
   */
  async getStatus (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const response = await _this.axios.get(
        `${_this.psfSlpIndexerApi}slp/status/`
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/address/  SLP  balance for address.
   * @apiName SLP  balance for address.
   * @apiGroup PSF SLP
   * @apiDescription Return SLP  balance for address
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "address": "bitcoincash:qzmd5vxgh9m22m6fgvm57yd6kjnjl9qnwywsf3583n" }' localhost:3000/v5/psf/slp/address
   *
   *
   */
  async getAddress (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      // Validate the input data.
      const address = req.body.address
      if (!address || address === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'address can not be empty'
        })
      }

      if (!address.includes('ecash')) {
        // Ensure the input is a valid BCH address.
        try {
          _this.bchjs.SLP.Address.toCashAddress(address)
        } catch (err) {
          res.status(400)
          return res.json({
            success: false,
            error: `Invalid BCH address. Double check your address is valid: ${address}`
          })
        }

        // Prevent a common user error. Ensure they are using the correct network address.
        const cashAddr = _this.bchjs.SLP.Address.toCashAddress(address)
        const networkIsValid = _this.routeUtils.validateNetwork(cashAddr)
        if (!networkIsValid) {
          res.status(400)
          return res.json({
            success: false,
            error:
              'Invalid network. Trying to use a testnet address on mainnet, or vice versa.'
          })
        }
      }

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/address/`,
        { address }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      // console.log('err', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/txid/  SLP transaction data.
   * @apiName SLP transaction data.
   * @apiGroup PSF SLP
   * @apiDescription Return slp transaction data.
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "txid": "f3e14cd871402a766e85045dc552f2c1e87857dd3ea1b15efab6334ccef5e315" }' localhost:3000/v5/psf/slp/txid
   *
   *
   */
  async getTxid (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const txid = req.body.txid
      if (!txid || txid === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'txid can not be empty'
        })
      }

      if (txid.length !== 64) {
        res.status(400)
        return res.json({
          success: false,
          error: 'This is not a txid'
        })
      }

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/tx/`,
        { txid }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      // console.log('err', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/token  List stats for a single slp token.
   * @apiName List stats for a single slp token.
   * @apiGroup PSF SLP
   * @apiDescription Return list stats for a single slp token.
   *
   * Inputs to POST body:
   *   - tokenId - (required) string containing the ID of the token to lookup.
   *   - withTxHistory - (optional) boolean if TX history should be included. Default is false.
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2" }' localhost:3000/v5/psf/slp/token
   *
   *
   */
  async getTokenStats (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()

      const tokenId = req.body.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'tokenId can not be empty'
        })
      }

      // Flag to toggle tx history of the token.
      let withTxHistory = false
      if (req.body.withTxHistory) withTxHistory = true

      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/token/`,
        { tokenId, withTxHistory }
      )

      res.status(200)
      return res.json(response.data)
    } catch (err) {
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/token/data  Get token data
   * @apiName Get token data
   * @apiGroup PSF SLP
   * @apiDescription Get mutable and immutable data if the token contains them.
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "f055256b938f1ecfa270459d6f12c7c8c82b66d3263c03d5074445a2b1a498a3" }' localhost:3000/v5/psf/slp/token/data
   *
   * Inputs to POST body:
   *   - tokenId - (required) string containing the ID of the token to lookup.
   *   - withTxHistory - (optional) boolean if TX history should be included. Default is false.
   *
   *
   */
  // Get mutable and immutable data for a token, if the token was created with
  // such data.
  //
  // Example:
  // curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "f055256b938f1ecfa270459d6f12c7c8c82b66d3263c03d5074445a2b1a498a3" }' localhost:3000/v5/psf/slp/token/data
  async getTokenData (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()
      const tokenData = {}

      const tokenId = req.body.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'tokenId can not be empty'
        })
      }

      // Flag to toggle tx history of the token.
      let withTxHistory = false
      if (req.body.withTxHistory) withTxHistory = true

      // get token stats from the Genesis TX of the token.
      const response = await _this.axios.post(
        `${_this.psfSlpIndexerApi}slp/token/`,
        { tokenId, withTxHistory }
      )
      // console.log('response', response.data)

      const tokenStats = response.data.tokenData

      tokenData.genesisData = tokenStats

      // try to get immutable data
      try {
        // const immutableData = await _this.getCIDData(tokenStats.documentUri)
        const immutableData = tokenStats.documentUri
        tokenData.immutableData = immutableData
      } catch (error) {
        tokenData.immutableData = ''
      }

      // try to get mutable data
      try {
        const mutableData = await _this.getMutableData(tokenStats.documentHash)
        tokenData.mutableData = mutableData
      } catch (error) {
        tokenData.mutableData = ''
      }

      res.status(200)
      return res.json(tokenData)
    } catch (err) {
      console.log('Error in getTokenData(): ', err)
      return _this.errorHandler(err, res)
    }
  }

  /**
   * @api {post} /psf/slp/token/data2  Get expanded token data
   * @apiName Get expanded token data
   * @apiGroup PSF SLP
   * @apiDescription Get expanded data for the token, including icons.
   *
   * Get the icon for a token, given it's token ID.
   * This function expects a string input of a token ID.
   * This function returns an object with a tokenIcon property that contains
   * the URL to the icon.
   *
   * The output object always have these properties:
   * - tokenIcon: A url to the token icon, if it exists.
   * - tokenStats: Data about the token from psf-slp-indexer.
   * - optimizedTokenIcon: An alternative, potentially more optimal, url to the token icon, if it exists.
   * - iconRepoCompatible: true if the token icon is available via token.bch.sx
   * - ps002Compatible: true if the token icon is compatible with PS007 specification.
   *
   *
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "f055256b938f1ecfa270459d6f12c7c8c82b66d3263c03d5074445a2b1a498a3" }' localhost:3000/v5/psf/slp/token/data2
   *
   * Inputs to POST body:
   *   - tokenId - (required) string containing the ID of the token to lookup.
   *   - withTxHistory - (optional) boolean if TX history should be included. Default is false.
   *
   *
   */
  // Get mutable and immutable data for a token, if the token was created with
  // such data.
  //
  // Example:
  // curl -H "Content-Type: application/json" -X POST -d '{ "tokenId": "f055256b938f1ecfa270459d6f12c7c8c82b66d3263c03d5074445a2b1a498a3" }' localhost:3000/v5/psf/slp/token/data
  async getTokenData2 (req, res, next) {
    try {
      // Verify env var is set for interacting with the indexer.
      _this.checkEnvVar()
      // const tokenData = {}

      // Input validation
      const tokenId = req.body.tokenId
      if (!tokenId || tokenId === '') {
        res.status(400)
        return res.json({
          success: false,
          error: 'tokenId can not be empty'
        })
      }

      const tokenData = await _this.slpTokenMedia.getIcon({ tokenId })
      // console.log('tokenData: ', tokenData)

      res.status(200)
      return res.json(tokenData)
    } catch (err) {
      console.log('Error in getTokenData(): ', err)
      return _this.errorHandler(err, res)
    }
  }

  // Retrieves the mutable data associated with a token document hash.
  async getMutableData (documentHash) {
    try {
      if (!documentHash || typeof documentHash !== 'string') {
        throw new Error(
          'documentHash string required when calling mutableData().'
        )
      }

      // Get the OP_RETURN data and decode it.
      const mutableData = await _this.decodeOpReturn(documentHash)
      const jsonData = JSON.parse(mutableData)
      console.log(`jsonData: ${JSON.stringify(jsonData, null, 2)}`)

      const mutableDataAddr = jsonData.mda

      // Gets the mutable data address (MDA) transaction history.
      const transactions = await _this.bchjs.Electrumx.transactions(mutableDataAddr)

      const mdaTxs = transactions.transactions
      // console.log(`mdaTxs: ${JSON.stringify(mdaTxs, null, 2)}`)

      let data = false
      // Maps each transaction of the mutableDataAddr.
      // If it finds an OP_RETURN, decode it. Exit the loop once the first
      // valid mutable data entry is found.
      // Start with the newest TXID entry and scan the history to find the first
      // entry with an IPFS CID.
      for (let i = mdaTxs.length - 1; i > -1; i--) {
        const tx = mdaTxs[i]
        const txid = tx.tx_hash
        console.log(`Retrieving and decoding txid ${txid}`)

        data = await _this.decodeOpReturn(txid)
        // console.log('data: ', data)

        //  Try parse the OP_RETURN data to a JSON object.
        if (data) {
          try {
            // console.log('Mutable Data  : ', data)

            // Convert the OP_RETURN data to a JSON object.
            const obj = JSON.parse(data)
            console.log(`obj: ${JSON.stringify(obj, null, 2)}`)

            // Keep searching if this TX does not have a cid value.
            if (!obj.cid) continue

            // Ensure data was generated by the MDA
            const txData = await this.bchjs.Transaction.get(txid)
            const vinAddress = txData.txData.vin[0].address

            // Skip entry if it was not made by the MDA private key.
            if (mutableDataAddr !== vinAddress) {
              console.log('Data is not generated by MDA, skipping.')
              data = false
              continue
            }

            break
          } catch (error) {
            continue
          }
        }
      }
      if (!data) {
        console.log('Mutable Data  Not found ')
      }

      // Get the CID:
      const obj = JSON.parse(data)
      const cid = obj.cid
      if (!cid) {
        throw new Error('CID could not be found in OP_RETURN data')
      }
      const result = cid

      // const result = await _this.getCIDData(cid)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return result
    } catch (err) {
      // console.log('Error in getMutableData().')
      console.log('Error in getMutableData(): ', err)
      throw err
    }
  }

  // Decodes the OP_RETURN of a transaction if this exists
  async decodeOpReturn (txid) {
    try {
      if (!txid || typeof txid !== 'string') {
        throw new Error('txid must be a string.')
      }

      // get transaction data
      const txData = await _this.bchjs.Electrumx.txData(txid)
      let data = false

      // Maps the vout of the transaction in search of an OP_RETURN
      for (let i = 0; i < txData.details.vout.length; i++) {
        const vout = txData.details.vout[i]

        const script = _this.bchjs.Script.toASM(
          Buffer.from(vout.scriptPubKey.hex, 'hex')
        ).split(' ')

        // Exit on the first OP_RETURN found.
        if (script[0] === 'OP_RETURN') {
          data = Buffer.from(script[1], 'hex').toString('ascii')
          break
        }
      }

      return data
    } catch (error) {
      console.log('Error in decodeOpReturn().')
      throw error
    }
  }

  // Get the immutable data stored in the documentUrl field of the token.
  async getCIDData (cid) {
    try {
      if (!cid || typeof cid !== 'string') {
        throw new Error('cid must be a string.')
      }

      // Assuming that CID starts with ipfs://. Cutting out that prefix.
      cid = cid.substring(7)

      const dataUrl = `https://${cid}.ipfs.dweb.link/data.json`
      console.log(`dataUrl: ${dataUrl}`)

      const response = await _this.axios.get(dataUrl)
      // console.log(`response.data: ${JSON.stringify(response.data, null, 2)}`)

      return response.data
    } catch (error) {
      console.log('Error in getCIDData(): ', error)
      throw error
    }
  }

  // Check the the environment variable is set correctly.
  checkEnvVar () {
    _this.psfSlpIndexerApi = process.env.SLP_INDEXER_API
    if (!_this.psfSlpIndexerApi) {
      throw new Error(
        'SLP_INDEXER_API env var not set. Can not connect to PSF SLP indexer.'
      )
    }
  }

  // DRY error handler.
  errorHandler (err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err)
    // console.log('errorHandler msg: ', msg)
    // console.log('errorHandler status: ', status)

    if (msg) {
      res.status(status)
      return res.json({ success: false, error: msg })
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
}

module.exports = PsfSlpIndexer
