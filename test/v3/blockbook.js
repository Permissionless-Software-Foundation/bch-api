/*
  TESTS FOR THE BLOCKBOOK.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

'use strict'

const chai = require('chai')
const assert = chai.assert

const sinon = require('sinon')

// Used during transition from integration to unit tests.
// let originalUrl
const originalUrl = process.env.BLOCKBOOK_URL

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'
if (process.env.TEST === 'unit') {
  process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'
}

// Only load blockbook library after setting BLOCKBOOK_URL env var.
const BlockbookRoute = require('../../src/routes/v3/blockbook')
const blockbookRoute = new BlockbookRoute()

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/blockbook-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#Blockbook Router', () => {
  let req, res
  let sandbox
  before(() => {
    // console.log(`Testing type is: ${process.env.TEST}`)

    if (!process.env.NETWORK) process.env.NETWORK = 'testnet'
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
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    process.env.BLOCKBOOK_URL = originalUrl
  })

  describe('#root', () => {
    // root route handler.
    const root = blockbookRoute.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'address', 'Returns static string')
    })
  })

  describe('#Balance Single', () => {
    // details route handler.
    // const balanceSingle = blockbookRoute.balanceSingle

    it('should throw 400 if address is empty', async () => {
      const result = await blockbookRoute.balanceSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('should error on an array', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await blockbookRoute.balanceSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'address can not be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await blockbookRoute.balanceSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await blockbookRoute.balanceSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.params.address = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await blockbookRoute.balanceSingle(req, res)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.equal(res.statusCode, 500, 'HTTP status code 500 expected.')
        assert.include(result.error, 'ENOTFOUND', 'Error message expected')
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it('returns proper error when downstream service stalls', async () => {
      req.params.address =
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await blockbookRoute.balanceSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      req.params.address =
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await blockbookRoute.balanceSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get balance for a single address', async () => {
      req.params.address =
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      // console.log(`process.env.BLOCKBOOK_URL: ${process.env.BLOCKBOOK_URL}`)

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockBalance
        })
      }

      // Call the details API.
      const result = await blockbookRoute.balanceSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'page',
        'totalPages',
        'itemsOnPage',
        'address',
        'balance',
        'totalReceived',
        'totalSent',
        'unconfirmedBalance',
        'unconfirmedTxs',
        'txs',
        'txids'
      ])
      assert.isArray(result.txids)
    })
  })

  describe('#Balance Bulk', () => {
    // details route handler.
    const balanceBulk = blockbookRoute.balanceBulk

    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
      }

      const result = await balanceBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
      }

      const result = await balanceBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should detect a network mismatch', async () => {
      req.body = {
        addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
      }

      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.body = {
          addresses: ['bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3']
        }

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await balanceBulk(req, res)
        // console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.isAbove(res.statusCode, 499, 'HTTP status code 500 expected.')
        // assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          'Network error: Could not communicate',
          'Error message expected'
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })
    it('returns proper error when downstream service stalls', async () => {
      req.body = {
        addresses: ['bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf']
      }
      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service is down', async () => {
      req.body = {
        addresses: ['bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf']
      }
      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should get details for a single address', async () => {
      req.body = {
        addresses: ['bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf']
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockBalance
        })
      }

      // Call the details API.
      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'page',
        'totalPages',
        'itemsOnPage',
        'address',
        'balance',
        'totalReceived',
        'totalSent',
        'unconfirmedBalance',
        'unconfirmedTxs',
        'txs',
        'txids'
      ])
      assert.isArray(result[0].txids)
    })

    it('should get details for multiple addresses', async () => {
      req.body = {
        addresses: [
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockBalance
        })
      }

      // Call the details API.
      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, '2 outputs for 2 inputs')
    })
  })

  describe('#UTXOs Single', () => {
    // details route handler.
    const utxosSingle = blockbookRoute.utxosSingle

    it('should throw 400 if address is empty', async () => {
      const result = await utxosSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('should error on an array', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'address can not be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.params.address = 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await utxosSingle(req, res)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.equal(res.statusCode, 500, 'HTTP status code 500 expected.')
        assert.include(result.error, 'ENOTFOUND', 'Error message expected')
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })
    it('returns proper error when downstream service stalls', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await utxosSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service is down', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await utxosSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should get utxos for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockUtxos
        })
      }

      // Call the details API.
      const result = await utxosSingle(req, res)
      // console.log(`result utxosSingle: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'txid',
        'vout',
        'value',
        'height',
        'confirmations'
      ])
    })
  })

  describe('#UTXO Bulk', () => {
    // details route handler.
    const utxosBulk = blockbookRoute.utxosBulk

    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
      }

      const result = await utxosBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
      }

      const result = await utxosBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should detect a network mismatch', async () => {
      req.body = {
        addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
      }

      const result = await utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.body = {
          addresses: ['bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf']
        }

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await utxosBulk(req, res)
        // console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.isAbove(res.statusCode, 499, 'HTTP status code 500 expected.')
        // assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          'Network error: Could not communicate',
          'Error message expected'
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it('returns proper error when downstream service stalls', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get details for a single address', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockUtxos
        })
      }

      // Call the details API.
      const result = await utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isArray(result[0])
      assert.hasAnyKeys(result[0][0], [
        'txid',
        'vout',
        'value',
        'height',
        'confirmations'
      ])
    })

    it('should get details for multiple addresses', async () => {
      req.body = {
        addresses: [
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockUtxos
        })
      }

      // Call the details API.
      const result = await utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isArray(result[0])
      assert.equal(result.length, 2, '2 outputs for 2 inputs')
    })
  })

  describe('#txSingle', () => {
    // route handler
    const txSingle = blockbookRoute.txSingle

    it('should throw 400 if txid is empty', async () => {
      const result = await txSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should error on an array', async () => {
      req.params.txid = [
        '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
      ]

      const result = await txSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txid can not be an array',
        'Proper error message'
      )
    })

    it('should throw 400 if txid is not a valid txid', async () => {
      req.params.txid = 'abc'

      const result = await txSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid must be of length 64')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.params.txid =
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await txSingle(req, res)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.equal(res.statusCode, 500, 'HTTP status code 500 expected.')
        assert.include(result.error, 'ENOTFOUND', 'Error message expected')
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })
    it('returns proper error when downstream service stalls', async () => {
      req.params.txid =
        '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await txSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service is down', async () => {
      req.params.txid =
        '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await txSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get tx details for a single txid', async () => {
      req.params.txid =
        '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockTx
        })
      }

      // process.env.BLOCKBOOK_URL = `https://157.230.178.198:19131/`
      // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

      // Call the details API.
      const result = await txSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result, [
        'txid',
        'version',
        'vin',
        'vout',
        'blockHash',
        'blockHeight',
        'confirmations',
        'blockTime',
        'value',
        'valueIn',
        'fees',
        'hex'
      ])

      // Vin
      assert.isArray(result.vin)
      assert.hasAnyKeys(result.vin[0], [
        'txid',
        'sequence',
        'n',
        'addresses',
        'value',
        'hex'
      ])

      // Vout
      assert.isArray(result.vout)
      assert.hasAnyKeys(result.vout[0], [
        'value',
        'n',
        'spent',
        'hex',
        'addresses'
      ])
    })
  })

  describe('#txBulk', () => {
    // route handler
    const txBulk = blockbookRoute.txBulk

    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await txBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids need to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body.txids =
        '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'

      const result = await txBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids need to be an array',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await txBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        txids: [
          '5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392',
          'abc'
        ]
      }

      const result = await txBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txid must be of length 64',
        'Proper error message'
      )
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.body = {
          txids: [
            '5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392'
          ]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = 'http://fakeurl/api/'

        const result = await txBulk(req, res)
        // console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.isAbove(res.statusCode, 499, 'HTTP status code 500 expected.')
        // assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          'Network error: Could not communicate',
          'Error message expected'
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })
    it('returns proper error when downstream service stalls', async () => {
      req.body = {
        txids: [
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
        ]
      }

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNABORTED'
      })

      const result = await txBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service is down', async () => {
      req.body = {
        txids: [
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
        ]
      }

      // Mock the timeout error.
      sandbox.stub(blockbookRoute.axios, 'request').throws({
        code: 'ECONNREFUSED'
      })

      const result = await txBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should get details for a single txid', async () => {
      req.body = {
        txids: [
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockTx
        })
      }

      // Call the details API.
      const result = await txBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'txid',
        'version',
        'vin',
        'vout',
        'blockHash',
        'blockHeight',
        'confirmations',
        'blockTime',
        'value',
        'valueIn',
        'fees',
        'hex'
      ])

      // Vin
      assert.isArray(result[0].vin)
      assert.hasAnyKeys(result[0].vin[0], [
        'txid',
        'sequence',
        'n',
        'addresses',
        'value',
        'hex'
      ])

      // Vout
      assert.isArray(result[0].vout)
      assert.hasAnyKeys(result[0].vout[0], [
        'value',
        'n',
        'spent',
        'hex',
        'addresses'
      ])
    })

    it('should get details for multiple txid', async () => {
      req.body = {
        txids: [
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d',
          '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(blockbookRoute.axios, 'request').resolves({
          data: mockData.mockTx
        })
      }

      // Call the details API.
      const result = await txBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, '2 outputs for 2 inputs')
    })
  })
})
