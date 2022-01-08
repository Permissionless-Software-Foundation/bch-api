/*
  TESTS FOR THE RAWTRANSACTIONS.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -Create e2e test for sendRawTransaction.

*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const Rawtransactions = require('../../src/routes/v4/full-node/rawtransactions')
const uut = new Rawtransactions()

// const nock = require('nock') // HTTP mocking

const sinon = require('sinon')
let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
// delete require.cache[require.resolve("./mocks/express-mocks")] // Fixes bug
// const { mockReq, mockRes, mockNext } = require('./mocks/express-mocks')
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/raw-transactions-mocks')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 5 }

describe('#Raw-Transactions', () => {
  // let req, res, next
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
    // next = mockNext

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}
    req.locals = {}

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
    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'rawtransactions', 'Returns static string')
    })
  })

  describe('decodeRawTransactionSingle()', () => {
    it('should throw error if hex is missing', async () => {
      const result = await uut.decodeRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hex can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      await uut.decodeRawTransactionSingle(req, res)
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
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.decodeRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.decodeRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should GET /decodeRawTransaction', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeRawTransaction } })
      }

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      const result = await uut.decodeRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'txid',
        'hash',
        'size',
        'version',
        'locktime',
        'vin',
        'vout'
      ])
      assert.isArray(result.vin)
      assert.isArray(result.vout)
    })
  })

  describe('decodeRawTransactionBulk()', () => {
    it('should throw 400 error if hexes array is missing', async () => {
      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hexes must be an array')
    })

    it('should throw 400 error if hexes array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.hexes = testArray

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw 400 error if hexes is empty', async () => {
      req.body.hexes = ['']

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Encountered empty hex')
    })

    it('should error on non-array single hex', async () => {
      req.body.hexes =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      const result = await uut.decodeRawTransactionBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'hexes must be an array',
        'Proper error message'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      req.body.hexes = [
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'
      ]
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service is down', async () => {
      req.body.hexes = [
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'
      ]
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should decode an array with a single hex', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeRawTransaction } })
      }

      req.body.hexes = [
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'
      ]

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'txid',
        'hash',
        'size',
        'version',
        'locktime',
        'vin',
        'vout'
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })

    it('should decode an array with multiple hexes', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeRawTransaction } })
      }

      req.body.hexes = [
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000',
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'
      ]

      const result = await uut.decodeRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'txid',
        'hash',
        'size',
        'version',
        'locktime',
        'vin',
        'vout'
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })
  })

  describe('decodeScriptSingle()', () => {
    it('should throw error if hex is missing', async () => {
      const result = await uut.decodeScriptSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hex can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      await uut.decodeScriptSingle(req, res)
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
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.decodeScriptSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.decodeScriptSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })
    it('should GET /decodeScriptSingle', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeScript } })
      }

      req.params.hex =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      const result = await uut.decodeScriptSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['asm', 'type', 'p2sh'])
    })
  })

  describe('decodeScriptBulk()', () => {
    it('should throw 400 error if hexes array is missing', async () => {
      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hexes must be an array')
    })

    it('should throw 400 error if hexes array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.hexes = testArray

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw 400 error if hexes is empty', async () => {
      req.body.hexes = ['']

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Encountered empty hex')
    })

    it('should error on non-array single hex', async () => {
      req.body.hexes =
        '0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000'

      const result = await uut.decodeScriptBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'hexes must be an array',
        'Proper error message'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.hexes = [
        '4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16'
      ]

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.hexes = [
        '4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16'
      ]

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should decode an array with a single hex', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeScript } })
      }

      req.body.hexes = [
        '4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16'
      ]

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ['asm', 'type', 'p2sh'])
    })

    it('should decode an array with a multiple hexes', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockDecodeScript } })
      }

      req.body.hexes = [
        '4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16',
        '4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16'
      ]

      const result = await uut.decodeScriptBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2)
      assert.hasAllKeys(result[0], ['asm', 'type', 'p2sh'])
    })
  })

  describe('getRawTransactionBulk()', () => {
    it('should throw 400 error if txids array is missing', async () => {
      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txids must be an array')
    })

    it('should throw 400 error if txids array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw 400 error if txid is empty', async () => {
      req.body.txids = ['']

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Encountered empty TXID')
    })

    it('should throw 400 error if txid is invalid', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .rejects('parameter 1 must be of length 64 (not 6)')
      }

      req.body.txids = ['abc123']

      const result = await uut.getRawTransactionBulk(req, res)

      assert.hasAllKeys(result, ['error'])
      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'parameter 1 must be of length 64 (not 6)')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'
      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should get concise transaction data', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockRawTransactionConcise } })
      }

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isString(result[0])
    })

    it('should get verbose transaction data', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockRawTransactionVerbose } })
      }

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]
      req.body.verbose = true

      const result = await uut.getRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'hex',
        'txid',
        'hash',
        'size',
        'version',
        'locktime',
        'vin',
        'vout',
        'blockhash',
        'confirmations',
        'time',
        'blocktime'
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })
  })

  describe('getRawTransactionSingle()', () => {
    it('should throw 400 error if txid is missing', async () => {
      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 400 error if txid is invalid', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .rejects('parameter 1 must be of length 64 (not 6)')
      }

      req.params.txid = 'abc123'

      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)
      // console.log(`res.statusCode: ${res.statusCode}`)

      assert.hasAllKeys(result, ['error'])
      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'parameter 1 must be of length 64 (not 6)')
    })
    it('returns proper error when downstream service stalls', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.txid =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'
      req.params.txid =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should get concise transaction data', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockRawTransactionConcise } })
      }

      req.params.txid =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
    })

    it('should get verbose transaction data', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockRawTransactionVerbose } })
      }

      req.params.txid =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      req.query.verbose = 'true'

      const result = await uut.getRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'hex',
        'txid',
        'hash',
        'size',
        'version',
        'locktime',
        'vin',
        'vout',
        'blockhash',
        'confirmations',
        'time',
        'blocktime'
      ])
      assert.isArray(result.vin)
      assert.isArray(result.vout)
    })
  })

  describe('sendRawTransactionBulk()', () => {
    it('should throw 400 error if hexs array is missing', async () => {
      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hex must be an array')
    })

    it('should throw 400 error if hexs array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.hexes = testArray

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw 400 error if hex array element is empty', async () => {
      req.body.hexes = ['']

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Encountered empty hex')
    })

    it('should throw 400 error if hex is invalid', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').rejects({
          response: {
            data: { error: { code: -22, message: 'TX decode failed' } }
          }
        })
      }

      req.body.hexes = ['abc123']

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'TX decode failed')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.hexes = [
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'
      ]
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'
      req.body.hexes = [
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'
      ]
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should submit hex encoded transaction', async () => {
      // This is a difficult test to run as transaction hex is invalid after a
      // block confirmation. So the unit tests simulates what the output 'should'
      // be, but the integration asserts an expected failure.

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').resolves({
          data: {
            result:
              'aef8848396e67532b42008b9d75b5a5a3459a6717740f31f0553b74102b4b118'
          }
        })
      }

      req.body.hexes = [
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'
      ]

      const result = await uut.sendRawTransactionBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      if (process.env.TEST === 'unit') {
        assert.isArray(result)
        assert.isString(result[0])

        // Integration test
      } else {
        if (process.env.ISBCHN) {
          assert.hasAllKeys(result, ['error'])
          assert.include(result.error, 'Missing inputs')
        } else {
          assert.hasAllKeys(result, ['error'])
          assert.include(result.error, 'bad-txns-inputs-missingorspent')
        }
      }
    })
  })

  describe('sendRawTransactionSingle()', () => {
    it('should throw an error for an empty hex', async () => {
      req.params.hex = ''

      const result = await uut.sendRawTransactionSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Encountered empty hex',
        'Proper error message'
      )
    })

    it('should throw an error for a non-string', async () => {
      req.params.hex = 456

      const result = await uut.sendRawTransactionSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'hex must be a string',
        'Proper error message'
      )
    })

    it('should throw 500 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl = process.env.BITCOINCOM_BASEURL
      const savedUrl2 = process.env.RPC_BASEURL
      const savedUrl3 = process.env.RPC_SENDURL

      // Manipulate the URL to cause a 500 network error.
      process.env.BITCOINCOM_BASEURL = 'http://fakeurl/api/'
      process.env.RPC_BASEURL = 'http://fakeurl/api/'
      process.env.RPC_SENDURL = 'http://fakeurl/api/'

      req.params.hex =
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'
      await uut.sendRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.BITCOINCOM_BASEURL = savedUrl
      process.env.RPC_BASEURL = savedUrl2
      process.env.RPC_SENDURL = savedUrl3

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or great expected.'
      )
    })

    it('should throw an error for invalid hex', async () => {
      req.params.hex = 'abc123'

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').rejects({
          response: {
            data: { error: { code: -22, message: 'TX decode failed' } }
          }
        })
      }

      const result = await uut.sendRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'TX decode failed')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hex =
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.sendRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('returns proper error when downstream service is down', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'
      req.params.hex =
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'

      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNREFUSED' })

      const result = await uut.sendRawTransactionSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2
    })

    it('should GET /sendRawTransaction/:hex', async () => {
      // This is a difficult test to run as transaction hex is invalid after a
      // block confirmation. So the unit tests simulates what the output 'should'
      // be, but the integration asserts an expected failure.

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').resolves({
          data: {
            result:
              'aef8848396e67532b42008b9d75b5a5a3459a6717740f31f0553b74102b4b118'
          }
        })
      }

      req.params.hex =
        '020000000136697692fed77bc4f5b6885295d0c56d1d0280fb578f445ce42be4eb6db381f2010000006a4730440220473adba0e7da14f0abf4817bbd591741ecb8da6544b998f10341f6704f5f05280220405221c626cb7edcf333367ebd469aff3f5a2169e37ee58eebb811ffc2fbc9e0412102202ff86325c5d903171fa5a2895c4efb3765105115460dc96f113048ddb69b47feffffff027a621b00000000001976a914e0a8ffc3b91e35f46618d6db90f66397989abf0588ac38041300000000001976a914a741f282af390bc7ea8c4375a3a56401d668564288ac2c330900'

      const result = await uut.sendRawTransactionSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      if (process.env.TEST === 'unit') {
        assert.isString(result)

        // Integration test
      } else {
        if (process.env.ISBCHN) {
          assert.hasAllKeys(result, ['error'])
          assert.include(result.error, 'Missing inputs')
        } else {
          assert.hasAllKeys(result, ['error'])
          assert.include(result.error, 'bad-txns-inputs-missingorspent')
        }
      }
    })
  })
})
