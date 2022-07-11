/*
  TESTS FOR THE ELECTRUMX.JS LIBRARY

  Named with a01 prefix so that these tests are run first. Something about running
  the Blcokbook and Blockchain tests screws up these tests. Spent a couple hours
  debugging and couldn't isolate the source of the issue, but renaming the file
  was an easy fix.

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

'use strict'

const chai = require('chai')
const assert = chai.assert

const sinon = require('sinon')

const ElecrumxRoute = require('../../src/routes/v5/electrumx')

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/electrumx-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

if (!process.env.FULCRUM_API) process.env.FULCRUM_API = 'http://localhost'

describe('#Electrumx', () => {
  let req, res
  let sandbox
  const electrumxRoute = new ElecrumxRoute()
  // let electrumxRoute

  before(async () => {
    if (!process.env.TEST) {
      process.env.TEST = 'unit'
    }
    console.log(`Testing type is: ${process.env.TEST}`)

    if (!process.env.NETWORK) process.env.NETWORK = 'testnet'

    // Connect to electrumx servers if this is an integration test.
    // if (process.env.TEST === 'integration') {
    //   await electrumxRoute.connect()
    //   console.log('Connected to ElectrumX server')
    // }
  })

  after(async () => {
    // console.log(`electrumxRoute.electrumx: `, electrumxRoute.electrumx)
    // Disconnect from the electrumx server if this is an integration test.
    // if (process.env.TEST === 'integration') {
    //   await electrumxRoute.disconnect()
    //   console.log('Disconnected from ElectrumX server')
    // }
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}

    sandbox = sinon.createSandbox()

    // electrumxRoute = new ElecrumxRoute()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    //
  })

  // A wrapper for stubbing with the Sinon sandbox.
  // function stubMethodForUnitTests (obj, method, value) {
  //   if (process.env.TEST !== 'unit') return false
  //
  //   electrumxRoute.isReady = true // Force flag.
  //
  //   sandbox.stub(obj, method).resolves(value)
  //
  //   return true
  // }

  describe('#root', () => {
    // root route handler.
    const root = electrumxRoute.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'electrumx', 'Returns static string')
    })
  })

  describe('#getBalance', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address is empty')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get balance for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'get')
          .resolves({ data: mockData.balance })
      }

      // Call the details API.
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'balance')
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })

    it('should get balance for a single eCash address', async () => {
      req.params.address =
        'ecash:qr5c4hfy52zn87484cucvzle5pljz0gtr5vhtw9z09'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'get')
          .resolves({ data: mockData.balance })
      }

      // Call the details API.
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'balance')
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })
  })

  describe('#balanceBulk', () => {
    it('should throw 400 if addresses is empty', async () => {
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if input provided is not array', async () => {
      req.body.addresses = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.body.addresses = ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.body.addresses = [
        'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
      ]

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.body.addresses = [
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
      ]

      // Call the details API.
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')
    })
    it('should handle error', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]
      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })
    it('should get balance for an array of addresses', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.balances })
      }

      // Call the details API.
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'balances')
      assert.property(result.balances[0], 'balance')
      assert.property(result.balances[0], 'address')

      assert.property(result.balances[0].balance, 'confirmed')
      assert.property(result.balances[0].balance, 'unconfirmed')
    })
  })
  describe('#getUtxos', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get utxos for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'get')
          .resolves({ data: { success: true, utxos: mockData.utxos } })
      }

      // Call the details API.
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.isArray(result.utxos)

      assert.property(result.utxos[0], 'height')
      assert.property(result.utxos[0], 'tx_hash')
      assert.property(result.utxos[0], 'tx_pos')
      assert.property(result.utxos[0], 'value')
    })
  })

  describe('#utxosBulk', () => {
    it('should throw 400 if addresses is empty', async () => {
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if input provided is not array', async () => {
      req.body.addresses = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.body.addresses = ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.body.addresses = [
        'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
      ]

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.body.addresses = [
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
      ]

      // Call the details API.
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')
    })
    it('should handle error', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]
      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })
    it('should get utxos for an array of addresses', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.utxosArray })
      }

      // Call the details API.
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.property(result.utxos[0], 'utxos')
      assert.property(result.utxos[0], 'address')

      assert.isArray(result.utxos[0].utxos)
      assert.isString(result.utxos[0].address)

      const firtsAddrUtxos = result.utxos[0].utxos[0]
      assert.property(firtsAddrUtxos, 'height')
      assert.property(firtsAddrUtxos, 'tx_hash')
      assert.property(firtsAddrUtxos, 'tx_pos')
      assert.property(firtsAddrUtxos, 'value')
    })
  })

  describe('#getTransactionDetails', () => {
    it('should throw 400 if tx is empty', async () => {
      const result = await electrumxRoute.getTransactionDetails(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'txid must be a string')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.txid = [
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'
      ]

      const result = await electrumxRoute.getTransactionDetails(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'txid must be a string')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      if (process.env.TEST === 'unit') {
        sandbox.stub(electrumxRoute.axios, 'get').rejects({
          response: {
            data: {
              error: {
                message: {
                  success: false,
                  error: 'Invalid tx hash'
                }
              }
            }
          }
        })
      }

      req.params.txid = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getTransactionDetails(req, res)
      // console.log('result: ', result)

      assert.property(result, 'error')
      assert.include(result.error.error, 'Invalid tx hash')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should get details for a single tx', async () => {
      req.params.txid =
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'get')
          .resolves({ data: { success: true, details: mockData.txDetails } })
      }

      // Call the details API.
      const result = await electrumxRoute.getTransactionDetails(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'details')
      assert.property(result.details, 'blockhash')
      assert.property(result.details, 'blocktime')
      assert.property(result.details, 'confirmations')
      assert.property(result.details, 'hash')
      assert.property(result.details, 'hex')
      assert.property(result.details, 'locktime')
      assert.property(result.details, 'size')
      assert.property(result.details, 'time')
      assert.property(result.details, 'txid')
      assert.property(result.details, 'version')
      assert.property(result.details, 'vin')
      assert.property(result.details, 'vout')
    })
  })

  describe('#transactionDetailsBulk', () => {
    it('should throw 400 if txids is empty', async () => {
      const result = await electrumxRoute.transactionDetailsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'txids needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if input provided is not array', async () => {
      req.body.txids =
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'

      const result = await electrumxRoute.transactionDetailsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'txids needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await electrumxRoute.transactionDetailsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should handle error', async () => {
      req.body.txids = [
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d',
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'
      ]
      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.transactionDetailsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })

    it('should get details for an array of tx', async () => {
      req.body.txids = [
        'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'
      ]

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.txDetailsBulk })
      }

      // Call the details API.
      const result = await electrumxRoute.transactionDetailsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'transactions')
      const tx = result.transactions[0]

      assert.property(tx, 'details')
      assert.property(tx.details, 'blockhash')
      assert.property(tx.details, 'blocktime')
      assert.property(tx.details, 'confirmations')
      assert.property(tx.details, 'hash')
      assert.property(tx.details, 'hex')
      assert.property(tx.details, 'locktime')
      assert.property(tx.details, 'size')
      assert.property(tx.details, 'time')
      assert.property(tx.details, 'txid')
      assert.property(tx.details, 'version')
      assert.property(tx.details, 'vin')
      assert.property(tx.details, 'vout')
    })
  })

  describe('#broadcastTransaction', () => {
    it('should throw 400 if txHex is empty', async () => {
      const result = await electrumxRoute.broadcastTransaction(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'request body must be a string')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on invalid input type', async () => {
      req.body.txHex = [mockData.txDetails.hex]

      const result = await electrumxRoute.broadcastTransaction(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'request body must be a string')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      if (process.env.TEST === 'unit') {
        sandbox.stub(electrumxRoute.axios, 'post').rejects({
          response: {
            data: {
              error: {
                message: {
                  success: false,
                  error:
                    'the transaction was rejected by network rules.\n\nTX decode failed\n'
                }
              }
            }
          }
        })
      }

      req.body.txHex = mockData.txDetails.hex.substring(10)
      const result = await electrumxRoute.broadcastTransaction(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')
      // assert.equal(res.statusCode, 503, 'Expect 503 status code')

      assert.property(result, 'error')
      assert.include(result.error.error, 'the transaction was rejected')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should broadcast transaction', async function () {
      req.body.txHex = mockData.txDetails.hex

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: { success: true, txid: mockData.txDetails.hash } })
      } else {
        return this.skip()
      }

      // Call the details API.
      const result = await electrumxRoute.broadcastTransaction(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'txid')
      assert.isString(result.txid)
    })
  })

  describe('#getBlockHeaders', () => {
    it('should throw 400 if height is empty', async () => {
      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'height must be a positive number')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })
    it('should throw 400 if height is not a number', async () => {
      req.params.height = 'wrong type'

      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'height must be a positive number')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })
    it('should throw 400 if height is negative', async () => {
      req.params.height = -1

      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'height must be a positive number')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if count is not a number', async () => {
      req.params.height = 2
      req.query.count = 'wrong type'

      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'count must be a positive number')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if count is negative', async () => {
      req.params.height = 2
      req.query.count = -1

      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'count must be a positive number')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      req.params.height = 99999999999999
      req.query.count = 99999999999999

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox.stub(electrumxRoute.axios, 'get').resolves({
          data: { success: false, error: { error: 'Invalid height' } }
        })
      }
      // Call the details API.
      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error.error, 'Invalid height')
    })
    it('should handle error', async () => {
      req.params.height = 42
      req.query.count = 2
      // Force error
      sandbox.stub(electrumxRoute.axios, 'get').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })

    it('should get headers for a single block height with count 2', async () => {
      req.params.height = 42
      req.query.count = 2
      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox.stub(electrumxRoute.axios, 'get').resolves({
          data: { success: true, headers: mockData.blockHeaders }
        })
      }

      // Call the details API.
      const result = await electrumxRoute.getBlockHeaders(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'headers')
      assert.isArray(result.headers)
      assert.deepEqual(result.headers, mockData.blockHeaders)
    })
  })
  describe('#blockHeadersBulk', () => {
    it('should throw 400 for an empty body', async () => {
      const result = await electrumxRoute.blockHeadersBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'heights needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should NOT throw 400 error for an invalid height', async () => {
      req.body = {
        heights: [{ height: -10, count: 2 }]
      }
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox.stub(electrumxRoute.axios, 'post').resolves({
          data: { success: true, headers: [{ headers: {} }] }
        })
      }
      const result = await electrumxRoute.blockHeadersBulk(req, res)
      console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 200, 'Expect 200 status code')

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'headers')
      assert.isArray(result.headers)
      assert.property(result.headers[0], 'headers')
    })

    it('should throw 400 error if heights array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.heights = testArray

      const result = await electrumxRoute.blockHeadersBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should handle error', async () => {
      req.body = {
        heights: [
          { height: 42, count: 2 },
          { height: 42, count: 2 }
        ]
      }

      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.blockHeadersBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })
    it('should get block heights', async () => {
      req.body = {
        heights: [
          { height: 42, count: 2 },
          { height: 42, count: 2 }
        ]
      }

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.
        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.blockHeadersBulk })
      }

      // Call the details API.
      const result = await electrumxRoute.blockHeadersBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'headers')
      assert.isArray(result.headers)
      assert.property(result.headers[0], 'headers')
    })
  })
  describe('#getTransactions', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get transaction for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox.stub(electrumxRoute.axios, 'get').resolves({
          data: { success: true, transactions: mockData.transactions }
        })
      }

      // Call the details API.
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'transactions')
      assert.isArray(result.transactions)

      assert.property(result.transactions[0], 'height')
      assert.property(result.transactions[0], 'tx_hash')
    })
  })
  describe('#transactionsBulk', () => {
    it('should throw 400 if addresses is empty', async () => {
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if input provided is not array', async () => {
      req.body.addresses = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.body.addresses = ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.body.addresses = [
        'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
      ]

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.body.addresses = [
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
      ]

      // Call the details API.
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')
    })
    it('should handle error', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]
      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })
    it('should get transaction for an array of addresses', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.transactionsBulk })
      }

      // Call the details API.
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'transactions')
      assert.isArray(result.transactions)

      assert.property(result.transactions[0], 'transactions')
      assert.isArray(result.transactions[0].transactions)

      assert.property(result.transactions[0].transactions[0], 'height')
      assert.property(result.transactions[0].transactions[0], 'tx_hash')
    })
  })
  describe('#getMempool', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 422, 'Expect 422 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get mempool for a single address', async () => {
      req.params.address =
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'get')
          .resolves({ data: { success: true, utxos: mockData.utxos } })
      }

      // Call the details API.
      const result = await electrumxRoute.getMempool(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.isArray(result.utxos)
    })
  })
  describe('#mempoolBulk', () => {
    it('should throw 400 if addresses is empty', async () => {
      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 if input provided is not array', async () => {
      req.body.addresses = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'addresses needs to be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'error')
      assert.include(result.error, 'Array too large')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.body.addresses = ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.body.addresses = [
        'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
      ]

      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.body.addresses = [
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
      ]

      // Call the details API.
      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid BCH address')
    })
    it('should handle error', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]
      // Force error
      sandbox.stub(electrumxRoute.axios, 'post').throws(new Error('Test error'))

      // Call the details API.
      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Test error')
    })
    it('should get mempool for multiple addresses', async () => {
      req.body.addresses = [
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      ]

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.axios, 'post')
          .resolves({ data: mockData.utxosArray })
      }

      // Call the details API.
      const result = await electrumxRoute.mempoolBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.property(result.utxos[0], 'utxos')
      assert.property(result.utxos[0], 'address')

      assert.isArray(result.utxos[0].utxos)
      assert.isString(result.utxos[0].address)
    })
  })

  // describe('#_utxosFromElectrumx', () => {
  //   it('should throw error for invalid address', async () => {
  //     try {
  //       // Address has invalid checksum.
  //       const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //       // Call the details API.
  //       await electrumxRoute._utxosFromElectrumx(address)
  //
  //       assert.equal(true, false, 'Unexpected code path')
  //     } catch (err) {
  //       assert.include(err.message, 'Invalid checksum')
  //     }
  //   })
  //
  //   it('should return empty array for address with no utxos', async () => {
  //     // Address has invalid checksum.
  //     const address = 'bchtest:qqtmlpspjakqlvywae226esrcdrj9auynuwadh55uf'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox.stub(electrumxRoute.electrumx, 'request').resolves([])
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._utxosFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.equal(result.length, 0)
  //   })
  //
  //   it('should get balance for a single address', async () => {
  //     const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.utxos)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._utxosFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.property(result[0], 'height')
  //     assert.property(result[0], 'tx_hash')
  //     assert.property(result[0], 'tx_pos')
  //     assert.property(result[0], 'value')
  //   })
  // })

  // describe('#getUtxos', () => {
  //   it('should throw 422 if address is empty', async () => {
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw 400 on array input', async () => {
  //     req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'address can not be an array')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
  //
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should pass errors from ElectrumX to user', async () => {
  //     // Address has invalid checksum.
  //     req.params.address =
  //       'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.utxos)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //   })
  //
  //   it('should get balance for a single address', async () => {
  //     req.params.address =
  //       'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_utxosFromElectrumx')
  //         .resolves(mockData.utxos)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getUtxos(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'utxos')
  //     assert.isArray(result.utxos)
  //
  //     assert.property(result.utxos[0], 'height')
  //     assert.property(result.utxos[0], 'tx_hash')
  //     assert.property(result.utxos[0], 'tx_pos')
  //     assert.property(result.utxos[0], 'value')
  //   })
  // })

  // describe('#utxosBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should error on non-array single address', async () => {
  //     req.body = {
  //       address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //     }
  //
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.body = {
  //       addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //     }
  //
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'Invalid BCH address',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw 400 error if addresses array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.addresses = testArray
  //
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.hasAllKeys(result, ['error'])
  //     assert.include(result.error, 'Array too large')
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.body = {
  //       addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
  //     }
  //
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //   })
  //
  //   it('should get details for a single address', async () => {
  //     req.body = {
  //       addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_utxosFromElectrumx')
  //         .resolves(mockData.utxos)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'utxos')
  //     assert.isArray(result.utxos)
  //
  //     assert.property(result.utxos[0], 'address')
  //     assert.property(result.utxos[0], 'utxos')
  //
  //     assert.isArray(result.utxos[0].utxos)
  //     assert.property(result.utxos[0].utxos[0], 'height')
  //     assert.property(result.utxos[0].utxos[0], 'tx_hash')
  //     assert.property(result.utxos[0].utxos[0], 'tx_pos')
  //     assert.property(result.utxos[0].utxos[0], 'value')
  //   })
  //
  //   it('should get utxos for multiple addresses', async () => {
  //     req.body = {
  //       addresses: [
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //       ]
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_utxosFromElectrumx')
  //         .resolves(mockData.utxos)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.utxosBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.utxos)
  //     assert.isArray(result.utxos[0].utxos)
  //     assert.equal(result.utxos.length, 2, '2 outputs for 2 inputs')
  //   })
  // })

  // describe('#_transactionDetailsFromElectrum', () => {
  //   it('should return error object for invalid txid', async () => {
  //     const txid =
  //       '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb25'
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Invalid tx hash')
  //     )
  //
  //     const result = await electrumxRoute._transactionDetailsFromElectrum(txid)
  //
  //     assert.instanceOf(result, Error)
  //     assert.include(result.message, 'Invalid tx hash')
  //   })
  //
  //   it('should get details for a single txid', async () => {
  //     const txid =
  //       '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails
  //     )
  //
  //     const result = await electrumxRoute._transactionDetailsFromElectrum(txid)
  //
  //     assert.isObject(result)
  //     assert.property(result, 'blockhash')
  //     assert.property(result, 'hash')
  //     assert.property(result, 'hex')
  //     assert.property(result, 'vin')
  //     assert.property(result, 'vout')
  //     assert.equal(result.hash, txid)
  //   })
  // })

  // describe('#getTransactionDetails', () => {
  //   it('should throw 400 if txid is not a string', async () => {
  //     req.params.txid = 5
  //
  //     const result = await electrumxRoute.getTransactionDetails(req, res)
  //
  //     expectRouteError(res, result, 'txid must be a string')
  //   })
  //
  //   it('should throw 400 on array input', async () => {
  //     req.params.txid = [
  //       '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //     ]
  //
  //     const result = await electrumxRoute.getTransactionDetails(req, res)
  //
  //     expectRouteError(res, result, 'txid must be a string')
  //   })
  //
  //   it('should return error object for invalid txid', async () => {
  //     req.params.txid =
  //       '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb25'
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Invalid tx hash')
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getTransactionDetails(req, res)
  //
  //     expectRouteError(res, result, 'Invalid tx hash')
  //   })
  //
  //   it('should get details for a single txid', async () => {
  //     req.params.txid =
  //       '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getTransactionDetails(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'details')
  //     assert.isObject(result.details)
  //
  //     assert.property(result.details, 'blockhash')
  //     assert.property(result.details, 'hash')
  //     assert.property(result.details, 'hex')
  //     assert.property(result.details, 'vin')
  //     assert.property(result.details, 'vout')
  //     assert.equal(result.details.hash, req.params.txid)
  //   })
  // })

  // describe('#transactionDetailsBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //
  //     expectRouteError(res, result, 'txids needs to be an array')
  //   })
  //
  //   it('should error on non-array single txid', async () => {
  //     req.body = {
  //       txid: '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //     }
  //
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //
  //     expectRouteError(res, result, 'txids needs to be an array')
  //   })
  //
  //   it('should NOT throw 400 error for an invalid txid', async () => {
  //     req.body = {
  //       txids: [
  //         '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb25'
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails
  //     )
  //
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //
  //     // This should probably throw a 400 error, but to be consistent with the other
  //     // bulk endpoints it doesn't throw. This will change in the future
  //     // expectRouteError(res, result, 'Invalid tx hash')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'transactions')
  //     assert.isArray(result.transactions)
  //   })
  //
  //   it('should throw 400 error if txid array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.txids = testArray
  //
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     expectRouteError(res, result, 'Array too large', 400)
  //   })
  //
  //   it('should get details for a single txid', async () => {
  //     req.body = {
  //       txids: [
  //         '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'transactions')
  //     assert.isArray(result.transactions)
  //
  //     assert.property(result.transactions[0], 'txid')
  //     assert.property(result.transactions[0], 'details')
  //
  //     assert.property(result.transactions[0].details, 'blockhash')
  //     assert.property(result.transactions[0].details, 'hash')
  //     assert.property(result.transactions[0].details, 'hex')
  //     assert.property(result.transactions[0].details, 'vin')
  //     assert.property(result.transactions[0].details, 'vout')
  //   })
  //
  //   it('should get details for multiple txids', async () => {
  //     req.body = {
  //       txids: [
  //         '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251',
  //         '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251'
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.transactionDetailsBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)'
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.transactions)
  //     assert.isObject(result.transactions[0].details)
  //     assert.equal(result.transactions.length, 2, '2 outputs for 2 inputs')
  //   })
  // })

  // describe('#_blockHeadersFromElectrum', () => {
  //   it('should return error object for invalid block height', async () => {
  //     const height = -10
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Invalid height')
  //     )
  //
  //     const result = await electrumxRoute._blockHeadersFromElectrum(height, 2)
  //
  //     assert.instanceOf(result, Error)
  //     assert.include(result.message, 'Invalid height')
  //   })
  //
  //   it('should return error object for invalid count', async () => {
  //     const height = 42
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Invalid count')
  //     )
  //
  //     const result = await electrumxRoute._blockHeadersFromElectrum(height, -1)
  //
  //     assert.instanceOf(result, Error)
  //     assert.include(result.message, 'Invalid count')
  //   })
  //
  //   it('should get block header for a single block height', async () => {
  //     const height = 42
  //
  //     const mockedResponse = { count: 2, hex: mockData.blockHeaders.join(''), max: 2016 }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockedResponse
  //     )
  //
  //     const result = await electrumxRoute._blockHeadersFromElectrum(height, 2)
  //
  //     assert.isArray(result)
  //     assert.deepEqual(result, mockData.blockHeaders)
  //   })
  // })

  // describe('#getBlockheaders', () => {
  //   it('should throw 400 if height is not a number', async () => {
  //     req.params.height = 'Hello'
  //
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'height must be a positive number')
  //   })
  //
  //   it('should throw 400 if height is negative', async () => {
  //     req.params.height = -42
  //
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'height must be a positive number')
  //   })
  //
  //   it('should throw 400 if count is not a number', async () => {
  //     req.params.height = 42
  //     req.query.count = 'Hello'
  //
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'count must be a positive number')
  //   })
  //
  //   it('should throw 400 if count is negative', async () => {
  //     req.params.height = 42
  //     req.query.count = -10
  //
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'count must be a positive number')
  //   })
  //
  //   it('should throw 400 on array input', async () => {
  //     req.params.height = [42, 42]
  //
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'height must be a positive number')
  //   })
  //
  //   it('should return error object for invalid height', async () => {
  //     req.params.height = 1000000000
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Invalid height')
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //
  //     expectRouteError(res, result, 'Invalid height')
  //   })
  //
  //   it('should get headers for a single block height with count 2', async () => {
  //     req.params.height = 42
  //     req.query.count = 2
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_blockHeadersFromElectrum',
  //       mockData.blockHeaders
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getBlockHeaders(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'headers')
  //     assert.isArray(result.headers)
  //     assert.deepEqual(result.headers, mockData.blockHeaders)
  //   })
  // })

  // describe('#blockHeadersBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //
  //     expectRouteError(res, result, 'heights needs to be an array')
  //   })
  //
  //   it('should error on non-array single height', async () => {
  //     req.body = {
  //       heights: 42
  //     }
  //
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //
  //     expectRouteError(res, result, 'heights needs to be an array')
  //   })
  //
  //   it('should NOT throw 400 error for an invalid height', async () => {
  //     req.body = {
  //       heights: [
  //         { height: -10, count: 2 }
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_blockHeadersFromElectrum',
  //       mockData.blockHeaders
  //     )
  //
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //
  //     // This should probably throw a 400 error, but to be consistent with the other
  //     // bulk endpoints it doesn't throw. This will change in the future
  //     // expectRouteError(res, result, 'Invalid tx hash')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'headers')
  //     assert.isArray(result.headers)
  //   })
  //
  //   it('should throw 400 error if heights array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.heights = testArray
  //
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //
  //     expectRouteError(res, result, 'Array too large', 400)
  //   })
  //
  //   it('should get details for a single height', async () => {
  //     req.body = {
  //       heights: [
  //         { height: 42, count: 2 }
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_blockHeadersFromElectrum',
  //       mockData.blockHeaders
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'headers')
  //     assert.isArray(result.headers)
  //
  //     assert.property(result.headers[0], 'headers')
  //     assert.isArray(result.headers[0].headers)
  //   })
  //
  //   it('should get details for multiple txids', async () => {
  //     req.body = {
  //       heights: [
  //         { height: 42, count: 2 },
  //         { height: 42, count: 2 }
  //       ]
  //     }
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_blockHeadersFromElectrum',
  //       mockData.blockHeaders
  //     )
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.blockHeadersBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)'
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.headers)
  //     assert.isArray(result.headers[0].headers)
  //     assert.equal(result.headers.length, 2, '2 outputs for 2 inputs')
  //   })
  // })

  // describe('#_broadcastTransactionWithElectrum', () => {
  //   it('should return error object for invalid formatted transaction', async () => {
  //     const invalidHex = mockData.txDetails.hex.substring(10)
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       new Error('Error: the transaction was rejected by network rules.\n\nTX decode failed\n')
  //     )
  //
  //     const result = await electrumxRoute._broadcastTransactionWithElectrum(invalidHex)
  //
  //     assert.instanceOf(result, Error)
  //     assert.include(result.message, 'TX decode failed')
  //   })
  //
  //   it('should return txid for valid transaction', async function () {
  //     // We cannot send an actual broadcast transaction to mainnet
  //     if (process.env.TEST !== 'unit') return this.skip()
  //
  //     const validHex = mockData.txDetails.hex
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute.electrumx,
  //       'request',
  //       mockData.txDetails.hash
  //     )
  //
  //     const result = await electrumxRoute._broadcastTransactionWithElectrum(validHex)
  //
  //     assert.typeOf(result, 'string')
  //     assert.equal(result, mockData.txDetails.hash)
  //   })
  // })

  // describe('#broadcastTransaction', () => {
  //   it('should throw an error for a non-string', async () => {
  //     req.body = 456
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_broadcastTransactionWithElectrum',
  //       new Error('request body must be a string.')
  //     )
  //
  //     const result = await electrumxRoute.broadcastTransaction(req, res)
  //
  //     expectRouteError(res, result, 'request body must be a string.')
  //   })
  //
  //   it('should throw an error object for invalid formatted transaction', async () => {
  //     req.body.txHex = mockData.txDetails.hex.substring(10)
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_broadcastTransactionWithElectrum',
  //       new Error('Error: the transaction was rejected by network rules.\n\nTX decode failed\n')
  //     )
  //
  //     const result = await electrumxRoute.broadcastTransaction(req, res)
  //
  //     expectRouteError(res, result, 'TX decode failed')
  //   })
  //
  //   it('should return txid for valid transaction', async function () {
  //     // We cannot send an actual broadcast transaction to mainnet
  //     if (process.env.TEST !== 'unit') return this.skip()
  //
  //     req.body.txHex = mockData.txDetails.hex
  //
  //     stubMethodForUnitTests(
  //       electrumxRoute,
  //       '_broadcastTransactionWithElectrum',
  //       mockData.txDetails.hash
  //     )
  //
  //     const result = await electrumxRoute.broadcastTransaction(req, res)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'txid')
  //     assert.equal(result.txid, mockData.txDetails.hash)
  //   })
  // })

  // describe('#_balanceFromElectrumx', () => {
  //   it('should throw error for invalid address', async () => {
  //     try {
  //       // Address has invalid checksum.
  //       const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //       // Mock unit tests to prevent live network calls.
  //       // if (process.env.TEST === 'unit') {
  //       //   electrumxRoute.isReady = true // Force flag.
  //       //
  //       //   sandbox
  //       //     .stub(electrumxRoute.electrumx, 'request')
  //       //     .throws('Invalid Argument: Invalid checksum:')
  //       // }
  //
  //       // Call the details API.
  //       await electrumxRoute._balanceFromElectrumx(address)
  //
  //       assert.equal(true, false, 'Unexpected code path')
  //     } catch (err) {
  //       // console.log('err2: ', err)
  //       assert.include(err.message, 'Invalid checksum')
  //     }
  //   })
  //
  //   it('should get balance for a single address', async () => {
  //     const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.balance)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._balanceFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'confirmed')
  //     assert.property(result, 'unconfirmed')
  //   })
  //
  //   it('should get balance for an address with no transaction history', async () => {
  //     const address = 'bitcoincash:qp2ew6pvrs22jtsvtjyumjgas6jkvgn2hy3ad4wpw8'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.balance)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._balanceFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'confirmed')
  //     assert.property(result, 'unconfirmed')
  //   })
  // })

  // describe('#balanceBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should error on non-array single address', async () => {
  //     req.body = {
  //       address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //     }
  //
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.body = {
  //       addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //     }
  //
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'Invalid BCH address',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw 400 error if addresses array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.addresses = testArray
  //
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.hasAllKeys(result, ['error'])
  //     assert.include(result.error, 'Array too large')
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.body = {
  //       addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
  //     }
  //
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //   })
  //
  //   it('should get details for a single address', async () => {
  //     req.body = {
  //       addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_balanceFromElectrumx')
  //         .resolves(mockData.balance)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'balances')
  //     assert.isArray(result.balances)
  //
  //     assert.property(result.balances[0], 'address')
  //     assert.property(result.balances[0], 'balance')
  //
  //     assert.property(result.balances[0].balance, 'confirmed')
  //     assert.property(result.balances[0].balance, 'unconfirmed')
  //   })
  //
  //   it('should get utxos for multiple addresses', async () => {
  //     req.body = {
  //       addresses: [
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //       ]
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_balanceFromElectrumx')
  //         .resolves(mockData.balance)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.balanceBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.balances)
  //     assert.equal(result.balances.length, 2, '2 outputs for 2 inputs')
  //   })
  // })

  // describe('#_transactionsFromElectrumx', () => {
  //   it('should throw error for invalid address', async () => {
  //     try {
  //       // Address has invalid checksum.
  //       const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //       // Call the details API.
  //       await electrumxRoute._transactionsFromElectrumx(address)
  //
  //       assert.equal(true, false, 'Unexpected code path')
  //     } catch (err) {
  //       // console.log('err2: ', err)
  //       assert.include(err.message, 'Invalid checksum')
  //     }
  //   })
  //
  //   it('should get transaction history for a single address', async () => {
  //     const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.txHistory)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._transactionsFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.property(result[0], 'height')
  //     assert.property(result[0], 'tx_hash')
  //   })
  //
  //   it('should get history for an address with no transaction history', async () => {
  //     const address = 'bitcoincash:qp2ew6pvrs22jtsvtjyumjgas6jkvgn2hy3ad4wpw8'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox.stub(electrumxRoute.electrumx, 'request').resolves([])
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._transactionsFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.equal(result.length, 0)
  //   })
  // })

  // describe('#getTransactions', () => {
  //   it('should throw 400 if address is empty', async () => {
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw 400 on array input', async () => {
  //     req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'address can not be an array')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
  //
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should pass errors from ElectrumX to user', async () => {
  //     // Address has invalid checksum.
  //     req.params.address =
  //       'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //   })
  //
  //   it('should get transactions for a single address', async () => {
  //     req.params.address =
  //       'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_transactionsFromElectrumx')
  //         .resolves(mockData.txHistory)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getTransactions(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'transactions')
  //     assert.isArray(result.transactions)
  //     assert.property(result.transactions[0], 'height')
  //     assert.property(result.transactions[0], 'tx_hash')
  //   })
  // })

  // describe('#balanceBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should error on non-array single address', async () => {
  //     req.body = {
  //       address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //     }
  //
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.body = {
  //       addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //     }
  //
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'Invalid BCH address',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw 400 error if addresses array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.addresses = testArray
  //
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.hasAllKeys(result, ['error'])
  //     assert.include(result.error, 'Array too large')
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.body = {
  //       addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
  //     }
  //
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //   })
  //
  //   it('should get details for a single address', async () => {
  //     req.body = {
  //       addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_transactionsFromElectrumx')
  //         .resolves(mockData.txHistory)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'transactions')
  //     assert.isArray(result.transactions)
  //
  //     assert.property(result.transactions[0], 'address')
  //     assert.property(result.transactions[0], 'transactions')
  //
  //     assert.isArray(result.transactions[0].transactions)
  //     assert.property(result.transactions[0].transactions[0], 'height')
  //     assert.property(result.transactions[0].transactions[0], 'tx_hash')
  //   })
  //
  //   it('should get utxos for multiple addresses', async () => {
  //     req.body = {
  //       addresses: [
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //       ]
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_transactionsFromElectrumx')
  //         .resolves(mockData.txHistory)
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.transactionsBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.transactions)
  //     assert.equal(result.transactions.length, 2, '2 outputs for 2 inputs')
  //   })
  // })

  // describe('#_mempoolFromElectrumx', () => {
  //   it('should throw error for invalid address', async () => {
  //     try {
  //       // Address has invalid checksum.
  //       const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //       // Call the details API.
  //       await electrumxRoute._mempoolFromElectrumx(address)
  //
  //       assert.equal(true, false, 'Unexpected code path')
  //     } catch (err) {
  //       assert.include(err.message, 'Invalid checksum')
  //     }
  //   })
  //
  //   it('should return empty array for address with no unconfirmed utxos', async () => {
  //     // Address has invalid checksum.
  //     const address = 'bchtest:qqtmlpspjakqlvywae226esrcdrj9auynuwadh55uf'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox.stub(electrumxRoute.electrumx, 'request').resolves([])
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._mempoolFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.equal(result.length, 0)
  //   })
  //
  //   it('should get mempool for a single address', async () => {
  //     const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute.electrumx, 'request')
  //         .resolves(mockData.mempool)
  //     } else {
  //       // Skip this test for integrations. Unconfirmed UTXOs are transient and
  //       // not easy to test in real-time.
  //       assert.equal(true, true)
  //       return
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute._mempoolFromElectrumx(address)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.property(result[0], 'height')
  //     assert.property(result[0], 'tx_hash')
  //     assert.property(result[0], 'fee')
  //   })
  // })

  // describe('#getMempool', () => {
  //   it('should throw 400 if address is empty', async () => {
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw 400 on array input', async () => {
  //     req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'address can not be an array')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 422, 'Expect 422 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'
  //
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'Expect 400 status code')
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //   })
  //
  //   it('should pass errors from electrum-cash to user', async () => {
  //     // Address has invalid checksum.
  //     req.params.address =
  //       'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, false)
  //
  //     assert.property(result, 'error')
  //     assert.include(result.error, 'Unsupported address format')
  //   })
  //
  //   it('should get mempool for a single address', async () => {
  //     req.params.address =
  //       'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //
  //     // Mock unit tests to prevent live network calls.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_mempoolFromElectrumx')
  //         .resolves(mockData.mempool)
  //     } else {
  //       // Skip this test for integrations. Unconfirmed UTXOs are transient and
  //       // not easy to test in real-time.
  //       assert.equal(true, true)
  //       return
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.getMempool(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'utxos')
  //     assert.isArray(result.utxos)
  //
  //     assert.property(result.utxos[0], 'height')
  //     assert.property(result.utxos[0], 'tx_hash')
  //     assert.property(result.utxos[0], 'fee')
  //   })
  // })

  // describe('#mempoolBulk', () => {
  //   it('should throw an error for an empty body', async () => {
  //     req.body = {}
  //
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should error on non-array single address', async () => {
  //     req.body = {
  //       address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //     }
  //
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'addresses needs to be an array',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should throw 400 error if addresses array is too large', async () => {
  //     const testArray = []
  //     for (var i = 0; i < 25; i++) testArray.push('')
  //
  //     req.body.addresses = testArray
  //
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.hasAllKeys(result, ['error'])
  //     assert.include(result.error, 'Array too large')
  //   })
  //
  //   it('should throw an error for an invalid address', async () => {
  //     req.body = {
  //       addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
  //     }
  //
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(
  //       result.error,
  //       'Invalid BCH address',
  //       'Proper error message'
  //     )
  //   })
  //
  //   it('should detect a network mismatch', async () => {
  //     req.body = {
  //       addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
  //     }
  //
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //     // console.log(`result: ${util.inspect(result)}`)
  //
  //     assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
  //     assert.include(result.error, 'Invalid network', 'Proper error message')
  //   })
  //
  //   it('should get mempool details for a single address', async () => {
  //     req.body = {
  //       addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_mempoolFromElectrumx')
  //         .resolves(mockData.mempool)
  //     } else {
  //       // Skip this test for integrations. Unconfirmed UTXOs are transient and
  //       // not easy to test in real-time.
  //       assert.equal(true, true)
  //       return
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.property(result, 'utxos')
  //     assert.isArray(result.utxos)
  //
  //     assert.property(result.utxos[0], 'address')
  //     assert.property(result.utxos[0], 'utxos')
  //
  //     assert.isArray(result.utxos[0].utxos)
  //     assert.property(result.utxos[0].utxos[0], 'height')
  //     assert.property(result.utxos[0].utxos[0], 'tx_hash')
  //     assert.property(result.utxos[0].utxos[0], 'fee')
  //   })
  //
  //   it('should get mempool for multiple addresses', async () => {
  //     req.body = {
  //       addresses: [
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
  //         'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
  //       ]
  //     }
  //
  //     // Mock the Insight URL for unit tests.
  //     if (process.env.TEST === 'unit') {
  //       electrumxRoute.isReady = true // Force flag.
  //
  //       sandbox
  //         .stub(electrumxRoute, '_mempoolFromElectrumx')
  //         .resolves(mockData.mempool)
  //     } else {
  //       // Skip this test for integrations. Unconfirmed UTXOs are transient and
  //       // not easy to test in real-time.
  //       assert.equal(true, true)
  //       return
  //     }
  //
  //     // Call the details API.
  //     const result = await electrumxRoute.mempoolBulk(req, res)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'success')
  //     assert.equal(result.success, true)
  //
  //     assert.isArray(result.utxos)
  //     assert.isArray(result.utxos[0].utxos)
  //     assert.equal(result.utxos.length, 2, '2 outputs for 2 inputs')
  //   })
  // })
})
