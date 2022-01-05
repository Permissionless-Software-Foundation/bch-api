/*
  TESTS FOR THE PRICE.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const sinon = require('sinon')

const Price = require('../../src/routes/v5/price')
let uut

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/price-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#PriceRouter', () => {
  let req, res
  let sandbox

  before(() => {
    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = 'unit'
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

    uut = new Price()
  })

  afterEach(() => {
    // Restore Sandbox
    sandbox.restore()
  })

  after(() => {})

  describe('#root', async () => {
    // root route handler.
    // const root = controlRoute.testableComponents.root

    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'price', 'Returns static string')
    })
  })

  describe('#getUSD', () => {
    // const getNetworkInfo = controlRoute.testableComponents.getNetworkInfo

    it('should throw 500 when network issues', async () => {
      uut.priceUrl = 'http://fakeurl/api/'

      await uut.getUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // console.log(res)
      assert.include(
        res.output.error,
        'Network error: Could not communicate with full node or other external service'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get the USD price of BCH', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: mockData.mockCoinbaseFeed })
      }

      const result = await uut.getUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })

  describe('#getBCHRate', () => {
    it('should throw 500 when network issues', async () => {
      uut.priceUrl = 'http://fakeurl/api/'

      await uut.getBCHRate(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // console.log(res)
      assert.include(
        res.output.error,
        'Network error: Could not communicate with full node or other external service'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBCHRate(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getBCHRate(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get several rates for BCH', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: mockData.mockCoinbaseFeed })
      }

      const result = await uut.getBCHRate(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // assert.isNumber(result)
      assert.property(result, 'USD')
      assert.property(result, 'CAD')
    })
  })

  describe('#errorHandler', () => {
    it('should handle unexpected errors', () => {
      sandbox.stub(uut.routeUtils, 'decodeError').returns({ msg: false })

      const result = uut.errorHandler(new Error('test error'), res)
      // console.log('result: ', result)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.property(result, 'error')
    })
  })

  describe('#getBCHAUSD', () => {
    // const getNetworkInfo = controlRoute.testableComponents.getNetworkInfo

    it('should throw 500 when network issues', async () => {
      uut.coinexPriceUrl = 'http://fakeurl/api/'

      await uut.getBCHAUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // console.log(res)
      assert.include(
        res.output.error,
        'Network error: Could not communicate with full node or other external service'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBCHAUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getBCHAUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get the USD price of BCH', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: mockData.mockCoinexFeed })
      }

      const result = await uut.getBCHAUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })

  describe('#getBCHUSD', () => {
    // const getNetworkInfo = controlRoute.testableComponents.getNetworkInfo

    it('should throw 500 when network issues', async () => {
      uut.bchCoinexPriceUrl = 'http://fakeurl/api/'

      await uut.getBCHUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // console.log(res)
      assert.include(
        res.output.error,
        'Network error: Could not communicate with full node or other external service'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBCHUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getBCHUSD(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get the USD price of BCH', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: mockData.mockCoinexFeed })
      }

      const result = await uut.getBCHUSD(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })
})
