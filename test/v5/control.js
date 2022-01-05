/*
  TESTS FOR THE CONTROL.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const ControlRoute = require('../../src/routes/v5/full-node/control')
const uut = new ControlRoute()
const sinon = require('sinon')

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/control-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#ControlRouter', () => {
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
    // const root = controlRoute.testableComponents.root

    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'control', 'Returns static string')
    })
  })

  describe('#GetNetworkInfo', () => {
    // const getNetworkInfo = controlRoute.testableComponents.getNetworkInfo

    it('should throw 500 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      await uut.getNetworkInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      // assert.include(result.error, "ENOTFOUND", "Error message expected")
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getNetworkInfo(req, res)
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

      const result = await uut.getNetworkInfo(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get info on the full node', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockGetNetworkInfo } })
      }

      const result = await uut.getNetworkInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'version',
        'subversion',
        'protocolversion',
        'localservices',
        'localrelay',
        'timeoffset',
        'networkactive',
        'connections',
        'networks',
        'relayfee',
        'excessutxocharge',
        'localaddresses',
        'warnings'
      ])
    })
  })
})
