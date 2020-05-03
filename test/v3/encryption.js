/*
  TESTS FOR THE ENCRYPTION.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

'use strict'

const chai = require('chai')
const assert = chai.assert

const sinon = require('sinon')

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

// Only load blockbook library after setting BLOCKBOOK_URL env var.
const EncryptionRoute = require('../../src/routes/v3/encryption')
const encryptionRoute = new EncryptionRoute()

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
// const mockData = require('./mocks/blockbook-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#Encryption Router', () => {
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

  after(() => {})

  describe('#root', () => {
    // root route handler.
    const root = encryptionRoute.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'encryption', 'Returns static string')
    })
  })
})
