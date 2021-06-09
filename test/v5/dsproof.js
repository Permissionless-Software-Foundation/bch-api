/*
  TESTS FOR THE DSPROOF.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const DSProofRoute = require('../../src/routes/v5/full-node/dsproof')
const uut = new DSProofRoute()

// const nock = require('nock') // HTTP mocking
const sinon = require('sinon')

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/dsproof-mocks')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#DSProof', () => {
  let req, res
  let sandbox
  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = 'unit'
    if (process.env.TEST === 'unit') {
      process.env.BITCOINCOM_BASEURL = 'http://fakeurl/api/'
      process.env.RPC_BASEURL = 'http://fakeurl/api'
      process.env.RPC_USERNAME = 'fakeusername'
      process.env.RPC_PASSWORD = 'fakepassword'
    }
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
    // Restore Sandbox
    sandbox.restore()
  })

  after(() => {
    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe('#root', async () => {
    // root route handler.
    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'dsproof', 'Returns static string')
    })
  })

  describe('#getDSProof', async () => {
    it('should throw 400 error if txid  is missing', async () => {
      const result = await uut.getDSProof(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error', 'success'])
      assert.isFalse(result.success)
      assert.include(result.error, 'txid can not be empty')
    })
    it('should throw 400 error if txid is invalid', async () => {
      req.params.txid = 'abc123'

      const result = await uut.getDSProof(req, res)

      assert.hasAllKeys(result, ['error', 'success'])
      assert.isFalse(result.success)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'txid must be of length 64')
    })
    it('should throw 503 when network issues', async () => {
      req.params.txid =
        'ee0df780b58f6f24467605b2589c44c3a50fc849fb8f91b89669a4ae0d86bc7e'

      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      await uut.getDSProof(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })
    it('returns proper error when downstream service stalls', async () => {
      req.params.txid =
        'ee0df780b58f6f24467605b2589c44c3a50fc849fb8f91b89669a4ae0d86bc7e'
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getDSProof(req, res)
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
        'ee0df780b58f6f24467605b2589c44c3a50fc849fb8f91b89669a4ae0d86bc7e'
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getDSProof(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET double-spend proof', async function () {
      req.params.txid =
        'ee0df780b58f6f24467605b2589c44c3a50fc849fb8f91b89669a4ae0d86bc7e'
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockGetDsProof } })
      } else {
        return this.skip()
      }

      const result = await uut.getDSProof(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.property(result, 'dspid')
      assert.property(result, 'txid')
      assert.property(result, 'outpoint')
      assert.property(result, 'path')
      assert.property(result, 'descendants')

      assert.property(result.outpoint, 'txid')
      assert.property(result.outpoint, 'vout')
    })
  })
})
