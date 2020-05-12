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
  mockServerUrl = 'http://fakeurl'
}

// Prepare the slpRoute for stubbing dependcies on slpjs.
const SlpRoute = require('../../src/routes/v3/slp')
const slpRoute = new SlpRoute()

// const pathStub = {} // Used to stub methods within slpjs.
// const slpRouteStub = proxyquire('../../src/routes/v3/slp', { slpjs: pathStub })

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/slp-mocks')
// const slpjsMock = require('./mocks/slpjs-mocks')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#SLP', () => {
  let req, res
  let sandbox

  before(() => {})

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

  describe('balancesForAddress()', () => {
    const balancesForAddress = slpRoute.balancesForAddress

    it('should throw 400 if address is empty', async () => {
      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('should throw 400 if address is invalid', async () => {
      req.params.address = 'badAddress'

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid BCH address.')
    })

    it('should throw 400 if address network mismatch', async () => {
      req.params.address = 'slptest:qzcvpw3ah7r880d49wsqzrsl90pg0rqjjurmj3g4nk'

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid')
    })

    it('should throw 5XX error when network issues', async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = 'http://fakeurl/api/'

      req.params.address =
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      assert.include(
        result.error,
        'Network error: Could not communicate',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.address =
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'

      const result = await balancesForAddress(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.params.address =
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should get token balance for an address', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: mockData.mockSingleAddress
        })
      }

      req.params.address =
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)

      assert.property(result[0], 'tokenId')
      assert.property(result[0], 'balanceString')
      assert.property(result[0], 'slpAddress')
      assert.property(result[0], 'balance')
      assert.property(result[0], 'decimalCount')

      assert.isNumber(result[0].balance)
      assert.isNumber(result[0].decimalCount)
    })
  })

  describe('balancesForAddressBulk()', () => {
    const balancesForAddressBulk = slpRoute.balancesForAddressBulk

    it('should throw 400 if addresses is empty', async () => {
      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'addresses needs to be an array')
    })

    it('should throw 400 if address is invalid', async () => {
      req.body.addresses = ['badAddress']

      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid BCH address.')
    })

    it('should throw 400 if address network mismatch', async () => {
      req.body.addresses = [
        'slptest:qzcvpw3ah7r880d49wsqzrsl90pg0rqjjurmj3g4nk'
      ]

      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid')
    })

    it('should throw 5XX error when network issues', async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = 'http://fakeurl/api/'

      req.body.addresses = [
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'
      ]

      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
      assert.include(
        result.error,
        'Network error: Could not communicate',
        'Error message expected'
      )
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.addresses = [
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'
      ]
      const result = await balancesForAddressBulk(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.body.addresses = [
        'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'
      ]
      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    // Only run as an integration test. Too complex to stub accurately.
    if (process.env.TEST !== 'unit') {
      it('should get token balance for an address', async () => {
        req.body.addresses = [
          'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'
        ]

        const result = await balancesForAddressBulk(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.isArray(result)
        assert.isArray(result[0])
        assert.hasAnyKeys(result[0][0], [
          'tokenId',
          'balance',
          'balanceString',
          'slpAddress',
          'decimalCount'
        ])
      })
    }
  })

  describe('validateBulk()', () => {
    const validateBulk = slpRoute.validateBulk

    it('should throw 400 if txid array is empty', async () => {
      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txids needs to be an array')
      assert.equal(res.statusCode, 400)
    })

    it('should throw 400 error if array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.txids = testArray

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.body.txids = [
        '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d'
      ]
      const result = await validateBulk(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.body.txids = [
        '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d'
      ]
      const result = await validateBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should validate array with single element', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: mockData.mockSingleValidTxid
        })
      }

      req.body.txids = [
        '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d'
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ['txid', 'valid'])
    })

    it('should validate array with two elements', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: mockData.mockTwoValidTxid
        })
      }

      req.body.txids = [
        '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d',
        '552112f9e458dc7d1d8b328b0a6685e8af74a64b60b6846e7c86407f27f47e42'
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ['txid', 'valid'])
      assert.equal(result.length, 2)
    })

    // Captures a regression bug that went out to production, captured in this
    // GitHub Issue: https://github.com/Bitcoin-com/rest.bitcoin.com/issues/518
    it('should return two elements if given two elements', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: mockData.mockTwoRedundentTxid
        })
      }

      req.body.txids = [
        'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56',
        'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56'
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ['txid', 'valid'])
      assert.equal(result.length, 2)
    })
  })

  describe('tokenStats()', () => {
    const tokenStats = slpRoute.tokenStats

    it('should throw 400 if tokenID is empty', async () => {
      req.params.tokenId = ''
      const result = await tokenStats(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenId can not be empty')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await tokenStats(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await tokenStats(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })

    it('should get token stats for tokenId', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: {
            t: [
              {
                tokenDetails: mockData.mockTokenDetails,
                tokenStats: mockData.mockTokenStats
              }
            ]
          }
        })
      }

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await tokenStats(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'blockCreated',
        'blockLastActiveMint',
        'blockLastActiveSend',
        'containsBaton',
        'initialTokenQty',
        'mintingBatonStatus',
        'circulatingSupply',
        'decimals',
        'documentHash',
        'versionType',
        'timestamp',
        'documentUri',
        'name',
        'symbol',
        'id',
        'totalBurned',
        'totalMinted',
        'txnsSinceGenesis',
        'validAddresses'
      ])
    })
  })

  describe('balancesForTokenSingle()', () => {
    const balancesForTokenSingle = slpRoute.balancesForTokenSingle

    it('should throw 400 if tokenID is empty', async () => {
      req.params.tokenId = ''
      const result = await balancesForTokenSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenId can not be empty')
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await balancesForTokenSingle(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await balancesForTokenSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    it('should get balances for tokenId', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        sandbox.stub(slpRoute.axios, 'request').resolves({
          data: {
            g: [mockData.mockBalance]
          }
        })
      }

      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

      const result = await balancesForTokenSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.property(result[0], 'tokenId')
      assert.property(result[0], 'slpAddress')
      assert.property(result[0], 'tokenBalanceString')
    })
  })

  describe('txDetails()', () => {
    const txDetails = slpRoute.txDetails

    it('should throw 400 if txid is empty', async () => {
      const result = await txDetails(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'txid can not be empty')
    })

    it('should throw 400 for malformed txid', async () => {
      req.params.txid =
        '57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457'

      const result = await txDetails(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'This is not a txid')
    })

    it('should throw 400 for non-existant txid', async () => {
      // Integration test
      if (process.env.TEST !== 'unit') {
        req.params.txid =
          '57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b94578223333'

        const result = await txDetails(req, res)
        // console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ['error'])
        assert.include(result.error, 'TXID not found')
      }
    })
    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.txid =
        '57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b94578223333'

      const result = await txDetails(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.params.txid =
        '57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b94578223333'

      const result = await txDetails(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
    if (process.env.TEST === 'integration') {
      it('should get tx details with token info', async () => {
        // TODO: add mocking for unit testing. How do I mock reponse form SLPDB
        // since it's not an object?

        // if (process.env.TEST === "unit") {
        //   // Mock the slpjs library for unit tests.
        //   pathStub.BitboxNetwork = slpjsMock.BitboxNetwork
        //   txDetails = slpRouteStub.testableComponents.txDetails
        // }

        req.params.txid =
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'

        const result = await txDetails(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.hasAnyKeys(result, ['tokenIsValid', 'tokenInfo'])
      })
    }
  })

  describe('txsTokenIdAddressSingle()', () => {
    const txsTokenIdAddressSingle = slpRoute.txsTokenIdAddressSingle

    it('should throw 400 if tokenId is empty', async () => {
      req.params.tokenId = ''
      const result = await txsTokenIdAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'tokenId can not be empty')
    })

    it('should throw 400 if address is empty', async () => {
      req.params.tokenId =
        '495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a'
      req.params.address = ''
      const result = await txsTokenIdAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('returns proper error when downstream service stalls', async () => {
      // Mock the timeout error.
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNABORTED' })

      req.params.tokenId =
        '7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796'
      req.params.address = 'slptest:qpwa35xq0q0cnmdu0rwzkct369hddzsqpsqdzw6h9h'

      const result = await txsTokenIdAddressSingle(req, res)
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
      sandbox.stub(slpRoute.axios, 'request').throws({ code: 'ECONNREFUSED' })

      req.params.tokenId =
        '7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796'
      req.params.address = 'slptest:qpwa35xq0q0cnmdu0rwzkct369hddzsqpsqdzw6h9h'

      const result = await txsTokenIdAddressSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
      assert.include(
        result.error,
        'Could not communicate with full node',
        'Error message expected'
      )
    })
  })

  describe('txsByAddressSingle()', () => {
    const txsByAddressSingle = slpRoute.txsByAddressSingle

    it('should throw 400 if address is missing', async () => {
      const result = await txsByAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('should throw 400 if address is empty', async () => {
      req.params.address = ''
      const result = await txsByAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'address can not be empty')
    })

    it('should throw 400 if address is invalid', async () => {
      req.params.address = 'badAddress'

      const result = await txsByAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid BCH address.')
    })

    it('should throw 400 if address network mismatch', async () => {
      req.params.address = 'slptest:qr83cu3p7yg9yac7qthwm0nul2ev2kukvsqmes3vl0'

      const result = await txsByAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Invalid')
    })

    it('should get tx history', async () => {
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(slpRoute.slpdb, 'getHistoricalSlpTransactions')
          .resolves(mockData.mockTxHistory)
      }

      // req.params.address = 'simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk'
      req.params.address =
        'simpleledger:qz4guf2k3p4r3t4tph0wwgyfq4p628lr2c0cvqplza'

      const result = await slpRoute.txsByAddressSingle(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
    })
  })
})

/*
  describe("listSingleToken()", () => {
    const listSingleToken = slpRoute.testableComponents.listSingleToken

    it("should throw 400 if tokenId is empty", async () => {
      const result = await listSingleToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return 'not found' for testnet txid on mainnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleToken)
      }

      req.params.tokenId =
        // testnet
        "d284e71227ec89f713b964d8eda595be6392bebd2fac46082bc5a9ce6fb7b33e"
      // mainnet
      //"259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1"

      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["id"])
      assert.include(result.id, "not found")
    })

    it("should get token information", async () => {
      // testnet
      const tokenIdToTest =
        "38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0"

      // console.log(`mockServerUrl: ${mockServerUrl}`)

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleToken)
        // sandbox.stub(axios, "get").resolves(mockData.mockSingleToken)
      }

      req.params.tokenId = tokenIdToTest

      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "id",
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "totalBurned",
        "totalMinted",
        "validAddresses",
        "timestamp_unix"
      ])
    })
  })

  describe("listBulkToken()", () => {
    const listBulkToken = slpRoute.testableComponents.listBulkToken

    it("should throw 400 if tokenIds array is empty", async () => {
      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenIds needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.tokenIds = testArray

      const result = await listBulkToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 if tokenId is empty", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockEmptyTokenId)
      }
      req.body.tokenIds = ""

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(
        result.error,
        "tokenIds needs to be an array. Use GET for single tokenId."
      )
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.body.tokenIds = [
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      ]

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return 'not found' for testnet txid on mainnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleTokenError)
      }

      req.body.tokenIds =
        // testnet
        ["d284e71227ec89f713b964d8eda595be6392bebd2fac46082bc5a9ce6fb7b33e"]
      // mainnet
      // ["0b314bc2b2905b8844222871c6b665ae3494117c83b11302824561bb904efb6b"]

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["id", "valid"])
      assert.strictEqual(result[0].valid, false)
    })

    it("should get token information for single token ID", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleToken)
      }

      req.body.tokenIds = [
        "38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0"
      ]

      const result = await listBulkToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "id",
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "totalBurned",
        "totalMinted",
        "validAddresses",
        "timestamp_unix"
      ])
    })

    it("should get token information for multiple token IDs", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleToken)
      }

      req.body.tokenIds = [
        "38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0",
        "38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0"
      ]

      const result = await listBulkToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "id",
        "totalBurned",
        "totalMinted",
        "validAddresses",
        "timestamp_unix"
      ])
    })
  })

  describe("balancesForAddressByTokenID()", () => {
    const balancesForAddressByTokenID =
      slpRoute.testableComponents.balancesForAddressByTokenID

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if tokenId is empty", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
      req.params.tokenId = ""
      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await balancesForAddressByTokenID(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address = "slptest:qzcvpw3ah7r880d49wsqzrsl90pg0rqjjurmj3g4nk"

      const result = await balancesForAddressByTokenID(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid")
    })

    it("should throw 5XX error when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.params.address =
        "simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn"
      req.params.tokenId =
        "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7"

      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      assert.include(
        result.error,
        "Network error: Could not communicate",
        "Error message expected"
      )
    })

    it("should get token information", async () => {
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleAddress)
      }

      req.params.address =
        "simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn"
      req.params.tokenId =
        "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7"

      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // TODO - add decimalCount
      // assert.hasAllKeys(result, ["tokenId", "balance", "decimalCount"])
      assert.hasAllKeys(result, ["tokenId", "balance"])
    })
  })

  describe("convertAddressSingle()", () => {
    const convertAddressSingle =
      slpRoute.testableComponents.convertAddressSingle

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      const result = await convertAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })
    //
    it("should convert address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .post(uri => uri.includes("/"))
          .reply(200, { result: mockData.mockConvert })
      }

      req.params.address =
        "simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn"

      const result = await convertAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["cashAddress", "legacyAddress", "slpAddress"])
    })
  })

  describe("convertAddressBulk()", () => {
    const convertAddressBulk = slpRoute.testableComponents.convertAddressBulk

    it("should throw 400 if addresses array is empty", async () => {
      const result = await convertAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "addresses needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await convertAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should error on malformed address", async () => {
      try {
        req.body.addresses = ["bitcoincash:qzs02v05l7qs5s5dwuj0cx5ehjm2c"]

        await convertAddressBulk(req, res)

        assert.equal(true, false, "Unexpected result!")
      } catch (err) {
        // console.log(`err.message: ${util.inspect(err.message)}`)

        assert.include(
          err.message,
          `Invalid BCH address. Double check your address is valid`
        )
      }
    })

    it("should validate array with single element", async () => {
      req.body.addresses = [
        "bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"
      ]

      const result = await convertAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "slpAddress",
        "cashAddress",
        "legacyAddress"
      ])
    })

    it("should validate array with multiple elements", async () => {
      req.body.addresses = [
        "bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c",
        "bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"
      ]

      const result = await convertAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "slpAddress",
        "cashAddress",
        "legacyAddress"
      ])
    })
  })

    describe('txsTokenIdAddressSingle()', () => {
    const txsTokenIdAddressSingle =
      slpRoute.txsTokenIdAddressSingle

    it("should get tx details with tokenId and address", async () => {
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, {
            c: mockData.mockTransactions
          })
      }

      //req.params.tokenId =
      //  "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"
      //req.params.address = "slptest:qr83cu3p7yg9yac7qthwm0nul2ev2kukvsqmes3vl0"

      req.params.tokenId =
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796"
      req.params.address = "slptest:qpwa35xq0q0cnmdu0rwzkct369hddzsqpsqdzw6h9h"

      const result = await txsTokenIdAddressSingle(req, res)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result[0], ["txid", "tokenDetails"])
    })

})

*/
