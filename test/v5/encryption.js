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
const EncryptionRoute = require('../../src/routes/v5/encryption')
const encryptionRoute = new EncryptionRoute()

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/encryption-mocks')

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

  describe('#getPublicKey', () => {
    it('should get public key from blockchain', async () => {
      req.params.address =
        'bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0'

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(encryptionRoute.bchjs.Electrumx, 'transactions')
          .resolves(mockData.mockFulcrumTxHistory)
        sandbox
          .stub(encryptionRoute.bchjs.RawTransactions, 'getRawTransaction')
          .resolves([mockData.mockTxDetails2])
      }

      const result = await encryptionRoute.getPublicKey(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'publicKey')
      assert.equal(
        result.publicKey,
        '044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c'
      )
    })

    it('should return false for address with no tx history', async () => {
      req.params.address =
        'bitcoincash:qqwfpk04ecf69wuprj9yjys9rla5mk7rj5j8uthqel'

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(encryptionRoute.bchjs.Electrumx, 'transactions')
          .resolves(mockData.mockFulcrumNoTxHistory)
      }

      const result = await encryptionRoute.getPublicKey(req, res)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'No transaction history')
    })

    it('should return false for address with no send history', async () => {
      req.params.address =
        'bitcoincash:qq78nwj5x97yh6wtlfd27dtlwjuh70vkjc59h8tgtg'

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(encryptionRoute.bchjs.Electrumx, 'transactions')
          .resolves(mockData.mockFulcrumNoSendBalance)
        sandbox
          .stub(encryptionRoute.bchjs.RawTransactions, 'getRawTransaction')
          .resolves([mockData.mockNoSendTx])
      }

      const result = await encryptionRoute.getPublicKey(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'publicKey')
      assert.include(result.publicKey, 'not found')
    })
  })
})
