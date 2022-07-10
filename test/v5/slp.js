/*
  TESTS FOR THE SLP.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -See listSingleToken() tests.
*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const sinon = require('sinon')
// const proxyquire = require('proxyquire').noPreserveCache()
// const axios = require('axios')

// Save existing environment variables.
// Used during transition from integration to unit tests.

// eslint-disable-next-line no-unused-vars
let mockServerUrl
const originalEnvVars = {
  BITDB_URL: process.env.BITDB_URL,
  BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
  SLPDB_URL: process.env.SLPDB_URL
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

// Block network connections for unit tests.
if (process.env.TEST === 'unit') {
  process.env.BITDB_URL = 'http://fakeurl/'
  process.env.BITCOINCOM_BASEURL = 'http://fakeurl/'
  process.env.SLPDB_URL = 'http://fakeurl/'
// mockServerUrl = 'http://fakeurl'
}

// Prepare the slpRoute for stubbing dependcies on slpjs.
const SlpRoute = require('../../src/routes/v5/slp')
const slpRoute = new SlpRoute()

// const pathStub = {} // Used to stub methods within slpjs.
// const slpRouteStub = proxyquire('../../src/routes/v5/slp', { slpjs: pathStub })

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
// const mockData = require('./mocks/slp-mocks')
// const slpjsMock = require('./mocks/slpjs-mocks')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#SLP', () => {
  let req, res
  let sandbox

  before(() => {
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
    req.locals = {}

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    // Restore any pre-existing environment variables.
    process.env.BITDB_URL = originalEnvVars.BITDB_URL
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.SLPDB_URL = originalEnvVars.SLPDB_URL
  })

  describe('#root', async () => {
    // root route handler.
    const root = slpRoute.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'slp', 'Returns static string')
    })
  })

  describe('#validate2Single', () => {
    it('should throw 400 if txid is empty', async () => {
      req.params.txid = ''
      const result = await slpRoute.validate2Single(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    /*
    it('should invalidate a known invalid TXID', async () => {
      if (process.env.TEST === 'unit') {
        // Mock to prevent live network connection.
        sandbox
          .stub(slpRoute.axios, 'request')
          .resolves({ data: { isValid: false } })
      }

      const txid =
        'f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a'

      req.params.txid = txid
      const result = await slpRoute.validate2Single(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.txid, txid)
      assert.equal(result.isValid, false)
    })
*/
    /*
    it('should validate a known valid TXID', async () => {
      if (process.env.TEST === 'unit') {
        // Mock to prevent live network connection.
        sandbox
          .stub(slpRoute.axios, 'request')
          .resolves({ data: { isValid: true } })
      }

      const txid =
        '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488'

      req.params.txid = txid
      const result = await slpRoute.validate2Single(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.txid, txid)
      assert.equal(result.isValid, true)
    })
*/
    // This test can only be run as a mocked unit test. It's too inconsistent
    // to run as an integration test, due to the caching built into slp-validate.
    if (process.env.TEST === 'unit') {
      it('should cancel if validation takes too long', async () => {
        // Mock the timeout error.
        sandbox.stub(slpRoute.axios, 'request').throws({
          code: 'ECONNABORTED'
        })

        const txid =
        'eacb1085dfa296fef6d4ae2c0f4529a1bef096dd2325bdcc6dcb5241b3bdb579'

        req.params.txid = txid
        const result = await slpRoute.validate2Single(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
        assert.include(
          result.error,
          'Could not communicate with full node',
          'Error message expected'
        )
      })
    }
  })

  describe('#generateSendOpReturn()', () => {
    const generateSendOpReturn = slpRoute.generateSendOpReturn
    // Validate tokenUtxos input
    it('should throw 400 if tokenUtxos is missing', async () => {
      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenUtxos needs to be an array.')
    })

    it('should throw 400 if tokenUtxos is empty', async () => {
      req.body.tokenUtxos = ''
      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenUtxos needs to be an array.')
    })

    it('should throw 400 if tokenUtxos is not array', async () => {
      req.body.tokenUtxos = 'tokenUtxos'

      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenUtxos needs to be an array.')
    })

    it('should throw 400 if tokenUtxos is empty array', async () => {
      req.body.tokenUtxos = []

      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenUtxos array can not be empty.')
    })

    // Validate sendQty input
    it('should throw 400 if sendQty is missing', async () => {
      req.body.tokenUtxos = [{}, {}, {}]
      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'sendQty must be a number')
    })

    it('should throw 400 if sendQty is empty', async () => {
      req.body.tokenUtxos = [{}, {}, {}]
      req.body.sendQty = ''

      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'sendQty must be a number')
    })

    it('should throw 400 if sendQty is not a number', async () => {
      req.body.tokenUtxos = [{}, {}, {}]
      req.body.sendQty = 'sendQty'

      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'sendQty must be a number')
    })

    it('should return OP_RETURN script', async () => {
      req.body.tokenUtxos = [
        {
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          decimals: 8,
          tokenQty: 2
        }
      ]
      req.body.sendQty = 1.5

      if (process.env.TEST === 'unit') {
        sandbox
          .stub(slpRoute.bchjs.SLP.TokenType1, 'generateSendOpReturn')
          .resolves({ script: '<Buffer ', outputs: 2 })
      }

      const result = await generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['script', 'outputs'])
      assert.isNumber(result.outputs)
    })
  })
})
