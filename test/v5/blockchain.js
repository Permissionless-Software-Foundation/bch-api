/*
  TODO:
  -getRawMempool
  --Add tests for 'verbose' input values
  -getMempoolEntry & getMempoolEntryBulk
  --Needs e2e test to create unconfirmed tx, for real-world test.
*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const sinon = require('sinon')

const Blockchain = require('../../src/routes/v5/full-node/blockchain')
const uut = new Blockchain()

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

if (!process.env.TEST) process.env.TEST = 'unit'

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/blockchain-mock')

let originalEnvVars // Used during transition from integration to unit tests.

describe('#BlockchainRouter', () => {
  let req, res
  let sandbox

  // local node will be started in regtest mode on the port 48332
  // before(panda.runLocalNode)

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
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
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    // Restore Sandbox
    sandbox.restore()
  })

  after(() => {
    // otherwise the panda will run forever
    // process.exit()

    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe('#root', () => {
    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)

      assert.equal(result.status, 'blockchain', 'Returns static string')
    })
  })

  describe('getBestBlockHash()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getBestBlockHash(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBestBlockHash(req, res)
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

      const result = await uut.getBestBlockHash(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getBestBlockHash', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockHash } })
      }

      const result = await uut.getBestBlockHash(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
      assert.equal(result.length, 64, 'Hash string is fixed length')
    })
  })

  describe('getBlockchainInfo()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getBlockchainInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBestBlockHash(req, res)
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

      const result = await uut.getBestBlockHash(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getBlockchainInfo', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockchainInfo } })
      }

      const result = await uut.getBlockchainInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'chain',
        'blocks',
        'headers',
        'bestblockhash',
        'difficulty',
        'mediantime',
        'verificationprogress',
        'chainwork',
        'pruned',
        'softforks',
        'bip9_softforks'
      ])
    })
  })

  describe('getBlockCount()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getBlockCount(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getBlockCount(req, res)
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

      const result = await uut.getBlockCount(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getBlockCount', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: 126769 } })
      }

      const result = await uut.getBlockCount(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe('getBlockHeaderSingle()', async () => {
    it('should throw 400 error if hash is missing', async () => {
      const result = await uut.getBlockHeaderSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'hash can not be empty')
    })
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.hash =
        '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900'

      const result = await uut.getBlockHeaderSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Network error: Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.hash =
        '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900'

      const result = await uut.getBlockHeaderSingle(req, res)
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

      req.params.hash =
        '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900'

      const result = await uut.getBlockHeaderSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should GET block header', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').resolves({
          data: {
            result:
              '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c'
          }
        })
      }

      req.params.hash =
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'

      const result = await uut.getBlockHeaderSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c'
      )
    })

    it('should GET verbose block header', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockHeader } })
      }

      req.query.verbose = true
      req.params.hash =
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'

      const result = await uut.getBlockHeaderSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        'hash',
        'confirmations',
        'height',
        'version',
        'versionHex',
        'merkleroot',
        'time',
        'mediantime',
        'nonce',
        'bits',
        'difficulty',
        'chainwork',
        'previousblockhash',
        'nextblockhash',
        'nTx'
      ])
    })
  })

  //

  describe('#getBlockHeaderBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await uut.getBlockHeaderBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'hashes needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single hash', async () => {
      req.body.hashes =
        '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900'

      const result = await uut.getBlockHeaderBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'hashes needs to be an array',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.hashes = testArray

      const result = await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should throw a 400 error for an invalid hash', async () => {
      req.body.hashes = ['badHash']

      await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
    })

    it('should throw 500 when network issues', async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body.hashes = [
          '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900'
        ]

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = 'http://fakeurl/api/'

        const result = await uut.getBlockHeaderBulk(req, res)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, 'HTTP status code 500 expected.')
        assert.include(result.error, 'ENOTFOUND', 'Error message expected')
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.hashes = [
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'
      ]

      const result = await uut.getBlockHeaderBulk(req, res)
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

      req.body.hashes = [
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'
      ]

      const result = await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get concise block header for a single hash', async () => {
      req.body.hashes = [
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'
      ]

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockHeaderConcise } })
      }

      // Call the details API.
      const result = await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.isArray(result)
      assert.equal(
        result[0],
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c'
      )
    })

    it('should get verbose block header for a single hash', async () => {
      req.body = {
        hashes: [
          '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'
        ],
        verbose: true
      }

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockHeader } })
      }

      // Call the details API.
      const result = await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        'hash',
        'confirmations',
        'height',
        'version',
        'versionHex',
        'merkleroot',
        'time',
        'mediantime',
        'nonce',
        'bits',
        'difficulty',
        'chainwork',
        'previousblockhash',
        'nextblockhash',
        'nTx'
      ])
    })

    it('should get details for multiple block heights', async () => {
      req.body.hashes = [
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0',
        '000000000000000002fa9d7851b284c53a5831651b04211c266badf2ad2d8ef0'
      ]

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockHeaderConcise } })
      }

      // Call the details API.
      const result = await uut.getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, '2 outputs for 2 inputs')
    })
  })
  describe('getChainTips()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getChainTips(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getChainTips(req, res)
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

      const result = await uut.getChainTips(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getChainTips', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockChainTips } })
      }

      const result = await uut.getChainTips(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], ['height', 'hash', 'branchlen', 'status'])
    })
  })
  describe('getDifficulty()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getDifficulty(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getDifficulty(req, res)
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

      const result = await uut.getDifficulty(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getDifficulty', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: 4049809.205246544 } })
      }

      const result = await uut.getDifficulty(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })
  describe('getMempoolInfo()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getMempoolInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getMempoolInfo(req, res)
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

      const result = await uut.getMempoolInfo(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getMempoolInfo', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockMempoolInfo } })
      }

      const result = await uut.getMempoolInfo(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'result',
        'bytes',
        'usage',
        'maxmempool',
        'mempoolminfree'
      ])
    })
  })

  describe('getRawMempool()', () => {
    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      const result = await uut.getRawMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      const result = await uut.getRawMempool(req, res)
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

      const result = await uut.getRawMempool(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getRawMempool', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockRawMempool } })
      }

      const result = await uut.getRawMempool(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      // Not sure what other assertions should be made here.
    })
  })

  describe('getMempoolEntrySingle()', () => {
    it('should throw 400 if txid is empty', async () => {
      const result = await uut.getMempoolEntrySingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolEntrySingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolEntrySingle(req, res)
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

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolEntrySingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getMempoolEntry', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(uut.axios, 'request').resolves({
          data: { result: { error: 'Transaction not in mempool' } }
        })
      }

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolEntrySingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.isString(result.error)
      assert.equal(result.error, 'Transaction not in mempool')
    })
  })
  describe('#getMempoolEntryBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await uut.getMempoolEntryBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single txid', async () => {
      req.body.txids =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolEntryBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids needs to be an array',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await uut.getMempoolEntryBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.txids = [
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
      ]

      const result = await uut.getMempoolEntryBulk(req, res)
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

      req.body.txids = [
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
      ]

      const result = await uut.getMempoolEntryBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    // Only execute on integration tests.
    if (process.env.TEST !== 'unit') {
      // Dev-note: This test passes because it expects an error. TXIDs do not
      // stay in the mempool for long, so it does not work well for a unit or
      // integration test.
      it('should retrieve single mempool entry', async () => {
        req.body.txids = [
          'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
        ]

        const result = await uut.getMempoolEntryBulk(req, res)
        // console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ['error'])
        assert.isString(result.error)
        assert.equal(result.error, 'Transaction not in mempool')
      })

      // Dev-note: This test passes because it expects an error. TXIDs do not
      // stay in the mempool for long, so it does not work well for a unit or
      // integration test.
      it('should retrieve multiple mempool entries', async () => {
        req.body.txids = [
          'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde',
          'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
        ]

        const result = await uut.getMempoolEntryBulk(req, res)
        // console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ['error'])
        assert.isString(result.error)
        assert.equal(result.error, 'Transaction not in mempool')
      })
    }
  })
  describe('getMempoolAncestorsSingle()', () => {
    it('should throw 400 if txid is empty', async () => {
      const result = await uut.getMempoolAncestorsSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolAncestorsSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolAncestorsSingle(req, res)
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

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getMempoolAncestorsSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should GET /getMempoolAncestorsSingle', async () => {
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: { result: mockData.mockAncestors } })

      req.params.txid =
        'bb0d349892d351da2767f8c45f6f7949713ff09bd12838d53e76158ddee3ce93'

      const result = await uut.getMempoolAncestorsSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
    })
  })

  describe('getTxOut()', () => {
    it('should throw 400 if txid is empty', async () => {
      const result = await uut.getTxOut(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 400 if n is empty', async () => {
      req.params.txid = 'sometxid'
      const result = await uut.getTxOut(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'n can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
      req.params.n = 0

      const result = await uut.getTxOut(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.params.n = 0
      req.query.include_mempool = 'true'

      const result = await uut.getTxOut(req, res)
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

      req.params.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.params.n = 0
      req.query.include_mempool = 'true'

      const result = await uut.getTxOut(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    // This test can only run for unit tests. See TODO at the top of this file.
    it('should GET /getTxOut', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockTxOut } })
      }

      req.params.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.params.n = 0
      req.query.include_mempool = 'true'

      const result = await uut.getTxOut(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result, [
        'bestblock',
        'confirmations',
        'value',
        'scriptPubKey',
        'coinbase'
      ])
      assert.hasAllKeys(result.scriptPubKey, [
        'asm',
        'hex',
        'reqSigs',
        'type',
        'addresses'
      ])
      assert.isArray(result.scriptPubKey.addresses)
    })
  })

  describe('getTxOutPost()', () => {
    it('should throw 400 if txid is empty', async () => {
      const result = await uut.getTxOutPost(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 400 if n is empty', async () => {
      req.body.txid = 'sometxid'
      const result = await uut.getTxOutPost(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'vout can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'
      req.body.vout = 0

      const result = await uut.getTxOutPost(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.body.vout = 0
      req.body.mempool = true

      const result = await uut.getTxOutPost(req, res)
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

      req.body.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.body.vout = 0
      req.body.mempool = true

      const result = await uut.getTxOutPost(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should POST /getTxOut', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockTxOut } })
      }

      req.body.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.body.vout = 0
      req.body.mempool = true

      const result = await uut.getTxOutPost(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result, [
        'bestblock',
        'confirmations',
        'value',
        'scriptPubKey',
        'coinbase'
      ])
      assert.hasAllKeys(result.scriptPubKey, [
        'asm',
        'hex',
        'reqSigs',
        'type',
        'addresses'
      ])
      assert.isArray(result.scriptPubKey.addresses)
    })
  })

  describe('getTxOutProofSingle()', () => {
    it('should throw 400 if txid is empty', async () => {
      const result = await uut.getTxOutProofSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.txid =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getTxOutProofSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.params.n = 0
      req.query.include_mempool = 'true'

      const result = await uut.getTxOutProofSingle(req, res)
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

      req.params.txid =
        '197dcda59864b1eee05498fd3c52cad787ec56ab7e635503cb39f9ab6f295d5d'
      req.params.n = 0
      req.query.include_mempool = 'true'

      const result = await uut.getTxOutProofSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET /getTxOutProof', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockTxOutProof } })
      }

      req.params.txid =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      const result = await uut.getTxOutProofSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })
  })

  describe('#getTxOutProofBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await uut.getTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single txid', async () => {
      req.body.txids =
        'd65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde'

      const result = await uut.getTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'txids needs to be an array',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await uut.getTxOutProofBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      const result = await uut.getTxOutProofBulk(req, res)
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

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      const result = await uut.getTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should GET proof for single txid', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockTxOutProof } })
      }

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      const result = await uut.getTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
    })

    it('should GET proof for multiple txids', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockTxOutProof } })
      }

      req.body.txids = [
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266',
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'
      ]

      const result = await uut.getTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, 'Correct length of returned array')
    })
  })
  describe('verifyTxOutProofSingle()', () => {
    it('should throw 400 if proof is empty', async () => {
      const result = await uut.verifyTxOutProofSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'proof can not be empty')
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.proof = mockData.mockTxOutProof

      const result = await uut.verifyTxOutProofSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.proof =
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'

      const result = await uut.verifyTxOutProofSingle(req, res)
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

      req.params.proof =
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'

      const result = await uut.verifyTxOutProofSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should GET /verifyTxOutProof', async () => {
      const expected =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: [expected] } })
      }

      req.params.proof =
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'

      const result = await uut.verifyTxOutProofSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
    })
  })
  describe('#verifyTxOutProofBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await uut.verifyTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'proofs needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single txid', async () => {
      req.body.proofs = mockData.mockTxOutProof

      const result = await uut.verifyTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'proofs needs to be an array',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.proofs = testArray

      const result = await uut.verifyTxOutProofBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.proofs = [
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'
      ]
      const result = await uut.verifyTxOutProofBulk(req, res)
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

      req.body.proofs = [
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'
      ]
      const result = await uut.verifyTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get single proof', async () => {
      const expected =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: [expected] } })
      }

      req.body.proofs = [
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'
      ]

      const result = await uut.verifyTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
    })

    it('should get multiple proofs', async () => {
      const expected =
        '2c7ae9f865f7ce0c33c189b2f83414176903ce4b06ed9f8b7bcf55efbd4a7266'

      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: [expected] } })
      }

      req.body.proofs = [
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700',
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'
      ]

      const result = await uut.verifyTxOutProofBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
      assert.equal(result.length, 2)
    })
  })

  describe('#getBlock()', () => {
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(uut.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.blockhash =
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'

      const result = await uut.getBlock(req, res)
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

      req.body.blockhash =
        '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c1e000000067139f230701a2819a76795564bd2f67ded7eeae68596f368eddb3dd5bc54e59320e896f71d61cfc3ae3d4a90fca08b1aa35ba91256d8939d2cad11e638c0081f66724abdef55cf7b8b9fed064bce0369171434f8b289c1330ccef765f8e97a2c0d794d81aafb535855f7daa6bb51e40f77c6b59d7af7f62d0eb726a4fc4df82353d56fcbda7c7ea6bd935d61af8fb3b295637e6f323b10231135b3f10a034cfb238f635830c0595e52c6c31247cf677b555f7a287076e20cd0e1d3cc9af7260f02b700'
      const result = await uut.getBlock(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should throw 400 if blockhash is empty', async () => {
      const result = await uut.getBlock(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'blockhash can not be empty')
    })

    it('should return block info with verbosity 0', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockInfo.verbosity0 } })
      }

      req.body.blockhash =
        '0000000000000000008e8d83cba6d45a9314bc2ef4538d4e0577c6bed8593536'
      req.body.verbosity = 0

      const result = await uut.getBlock(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should return block info with verbosity 1', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockInfo.verbosity1 } })
      }

      req.body.blockhash =
        '0000000000000000008e8d83cba6d45a9314bc2ef4538d4e0577c6bed8593536'
      req.body.verbosity = 1

      const result = await uut.getBlock(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'hash', 'hash property expected')
      assert.property(
        result,
        'confirmations',
        'confirmations property expected'
      )
      assert.property(result, 'size', 'size property expected')
      assert.property(result, 'height', 'height property expected')
      assert.property(result, 'version', 'version property expected')
      assert.property(result, 'versionHex', 'versionHex property expected')
      assert.property(result, 'merkleroot', 'merkleroot property expected')
      assert.property(result, 'tx', 'tx property expected')
      assert.property(result, 'time', 'time property expected')
      assert.property(result, 'mediantime', 'mediantime property expected')
      assert.property(result, 'nonce', 'nonce property expected')
      assert.property(result, 'bits', 'bits property expected')
      assert.property(result, 'difficulty', 'difficulty property expected')
      assert.property(result, 'chainwork', 'chainwork property expected')
      assert.property(result, 'nTx', 'nTx property expected')
      assert.property(
        result,
        'previousblockhash',
        'previousblockhash property expected'
      )
      assert.property(
        result,
        'nextblockhash',
        'nextblockhash property expected'
      )
    })

    it('should return block info with verbosity 2', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockInfo.verbosity1 } })
      }

      req.body.blockhash =
        '0000000000000000008e8d83cba6d45a9314bc2ef4538d4e0577c6bed8593536'
      req.body.verbosity = 2

      const result = await uut.getBlock(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'hash', 'hash property expected')
      assert.property(
        result,
        'confirmations',
        'confirmations property expected'
      )
      assert.property(result, 'size', 'size property expected')
      assert.property(result, 'height', 'height property expected')
      assert.property(result, 'version', 'version property expected')
      assert.property(result, 'versionHex', 'versionHex property expected')
      assert.property(result, 'merkleroot', 'merkleroot property expected')
      assert.property(result, 'tx', 'tx property expected')
      assert.property(result, 'time', 'time property expected')
      assert.property(result, 'mediantime', 'mediantime property expected')
      assert.property(result, 'nonce', 'nonce property expected')
      assert.property(result, 'bits', 'bits property expected')
      assert.property(result, 'difficulty', 'difficulty property expected')
      assert.property(result, 'chainwork', 'chainwork property expected')
      assert.property(result, 'nTx', 'nTx property expected')
      assert.property(
        result,
        'previousblockhash',
        'previousblockhash property expected'
      )
      assert.property(
        result,
        'nextblockhash',
        'nextblockhash property expected'
      )
    })

    it('should return block info without verbosity especified', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(uut.axios, 'request')
          .resolves({ data: { result: mockData.mockBlockInfo.verbosity1 } })
      }

      req.body.blockhash =
        '0000000000000000008e8d83cba6d45a9314bc2ef4538d4e0577c6bed8593536'

      const result = await uut.getBlock(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'hash', 'hash property expected')
      assert.property(
        result,
        'confirmations',
        'confirmations property expected'
      )
      assert.property(result, 'size', 'size property expected')
      assert.property(result, 'height', 'height property expected')
      assert.property(result, 'version', 'version property expected')
      assert.property(result, 'versionHex', 'versionHex property expected')
      assert.property(result, 'merkleroot', 'merkleroot property expected')
      assert.property(result, 'tx', 'tx property expected')
      assert.property(result, 'time', 'time property expected')
      assert.property(result, 'mediantime', 'mediantime property expected')
      assert.property(result, 'nonce', 'nonce property expected')
      assert.property(result, 'bits', 'bits property expected')
      assert.property(result, 'difficulty', 'difficulty property expected')
      assert.property(result, 'chainwork', 'chainwork property expected')
      assert.property(result, 'nTx', 'nTx property expected')
      assert.property(
        result,
        'previousblockhash',
        'previousblockhash property expected'
      )
      assert.property(
        result,
        'nextblockhash',
        'nextblockhash property expected'
      )
    })
  })
})
