/*
  TESTS FOR THE UTIL.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  These tests use this private key:
  L1wAGEN721LHDoiN8pLwwBb87bYrU6Gs21UPcCRR7LjKypQyVaCq
  Which corresponds to this address:
  bitcoincash:qp2g4cnekxsjspccmtvh5k73mczz6273js4mjr353r
*/

'use strict'

// Public npm libraries
const assert = require('chai').assert
const nock = require('nock') // HTTP mocking
const sinon = require('sinon')

// Local libraries
const Electrumx = require('../../src/routes/v4/electrumx')
const UtilRoute = require('../../src/routes/v4/util')

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/util-mocks')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// const UtilRoute = utilRoute.UtilRoute
// const electrumx = new Electrumx()
const utilRouteInst = new UtilRoute({ electrumx: {} })

describe('#Util', () => {
  let req, res
  let sandbox
  let electrumx
  let utilRoute

  before(async () => {
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

    electrumx = new Electrumx()
    // await electrumx.connect()
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

    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()

    sandbox = sinon.createSandbox()

    utilRoute = new UtilRoute({ electrumx })
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()

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
    const root = utilRouteInst.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'util', 'Returns static string')
    })
  })

  describe('#validateAddressSingle', async () => {
    const validateAddress = utilRouteInst.validateAddressSingle

    it('should throw an error for an empty address', async () => {
      const result = await validateAddress(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'address can not be empty',
        'Proper error message'
      )
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.params.address = 'bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y'

      await validateAddress(req, res)
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

    it('should validate address', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        nock(`${process.env.RPC_BASEURL}`)
          .post((uri) => uri.includes('/'))
          .reply(200, { result: mockData.mockAddress })
      }

      req.params.address =
        'bitcoincash:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5hzljcrnd'

      const result = await validateAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        'isvalid',
        'address',
        'scriptPubKey',
        'ismine',
        'iswatchonly',
        'isscript'
      ])
    })
  })

  describe('#validateAddressBulk', async () => {
    const validateAddressBulk = utilRouteInst.validateAddressBulk

    it('should throw an error for an empty body', async () => {
      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array. Use GET for single address.',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        addresses: 'bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y'
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array. Use GET for single address.',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (let i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await validateAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should error on invalid address', async () => {
      req.body = {
        addresses: ['bchtest:qqqk4y6lsl5da64sg5qc3xezmpl']
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address. Double check your address is valid',
        'Proper error message'
      )
    })

    it('should error on mainnet address when using testnet', async () => {
      req.body = {
        addresses: ['bchtest:qrls6vzjkkxlds7aqv9075u0fttwc7u9jvczn5fdt9']
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid network. Trying to use a testnet address on mainnet, or vice versa.',
        'Proper error message'
      )
    })

    it('should throw 503 when network issues', async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = 'http://fakeurl/api/'

      req.body.addresses = [
        'bitcoincash:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5hzljcrnd'
      ]

      await validateAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        'HTTP status code 500 or greater expected.'
      )
    })

    it('should validate a single address', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        nock(`${process.env.RPC_BASEURL}`)
          .post((uri) => uri.includes('/'))
          .reply(200, { result: mockData.mockAddress })
      }

      req.body.addresses = [
        'bitcoincash:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5hzljcrnd'
      ]

      const result = await validateAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'isvalid',
        'address',
        'scriptPubKey',
        'ismine',
        'iswatchonly',
        'isscript'
      ])
    })

    it('should validate a multiple addresses', async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === 'unit') {
        nock(`${process.env.RPC_BASEURL}`)
          .post((uri) => uri.includes('/'))
          .times(2)
          .reply(200, { result: mockData.mockAddress })
      }

      req.body.addresses = [
        'bitcoincash:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5hzljcrnd',
        'bitcoincash:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5hzljcrnd'
      ]

      const result = await validateAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'isvalid',
        'address',
        'scriptPubKey',
        'ismine',
        'iswatchonly',
        'isscript'
      ])
    })
  })

  describe('#sweepWif', () => {
    it('should throw 400 if WIF is not included', async () => {
      req.body = {}

      const result = await utilRouteInst.sweepWif(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'WIF needs to a proper compressed WIF starting with K or L',
        'Proper error message'
      )
    })

    it('should throw 400 if WIF is malformed', async () => {
      req.body = {
        wif: 'abc123'
      }

      const result = await utilRouteInst.sweepWif(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'WIF needs to a proper compressed WIF starting with K or L',
        'Proper error message'
      )
    })

    it('should throw 400 if destination address is not included', async () => {
      req.body = {
        wif: 'L5GEFg1tETLWBugmhSo9Zc4ms968qVmfmTroDxsJ982AiudAQGyt'
      }

      const result = await utilRouteInst.sweepWif(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'address can not be empty',
        'Proper error message'
      )
    })

    // Unit test only.
    if (process.env.TEST === 'unit') {
      it('should generate transaction for valid token sweep', async () => {
        // Mock the RPC call for unit tests.

        sandbox
          .stub(utilRoute.electrumx, '_balanceFromElectrumx')
          .resolves(mockData.mockBalance)

        sandbox
          .stub(utilRoute.electrumx, '_utxosFromElectrumx')
          .resolves(mockData.mockUtxos)

        sandbox
          .stub(utilRoute.bchjs.SLP.Utils, 'tokenUtxoDetails')
          .resolves(mockData.mockIsTokenUtxos)

        // Mock sendRawTransaction() so that the hex does not actually get broadcast
        // to the network.
        sandbox
          .stub(utilRoute.bchjs.RawTransactions, 'sendRawTransaction')
          .resolves('test-txid')

        req.body = {
          wif: 'L1wAGEN721LHDoiN8pLwwBb87bYrU6Gs21UPcCRR7LjKypQyVaCq',
          toAddr: 'bitcoincash:qp2g4cnekxsjspccmtvh5k73mczz6273js4mjr353r'
        }

        const result = await utilRoute.sweepWif(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(result, 'test-txid')
      })

      it('should return balance if balance-only is true', async () => {
        // Mock the RPC call for unit tests.

        sandbox
          .stub(utilRoute.electrumx, '_balanceFromElectrumx')
          .resolves(mockData.mockBalance)

        // Mock sendRawTransaction() so that the hex does not actually get broadcast
        // to the network.
        sandbox
          .stub(utilRoute.bchjs.RawTransactions, 'sendRawTransaction')
          .resolves('test-txid')

        req.body = {
          wif: 'L5GEFg1tETLWBugmhSo9Zc4ms968qVmfmTroDxsJ982AiudAQGyt',
          balanceOnly: true
        }

        const result = await utilRoute.sweepWif(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.isNumber(result)
      })

      it('should generate transaction for valid BCH-only sweep', async () => {
        sandbox
          .stub(utilRoute.electrumx, '_balanceFromElectrumx')
          .resolves(mockData.mockBalance)

        sandbox
          .stub(utilRoute.electrumx, '_utxosFromElectrumx')
          .resolves(mockData.mockUtxos)

        // Force token utxo to appear as regular BCH utxo.
        sandbox
          .stub(utilRoute.bchjs.SLP.Utils, 'tokenUtxoDetails')
          .resolves([false, false])

        // Mock sendRawTransaction() so that the hex does not actually get broadcast
        // to the network.
        sandbox
          .stub(utilRoute.bchjs.RawTransactions, 'sendRawTransaction')
          .resolves('test-txid')

        req.body = {
          wif: 'L5GEFg1tETLWBugmhSo9Zc4ms968qVmfmTroDxsJ982AiudAQGyt',
          toAddr: 'bitcoincash:qz2qn6zt4qmacf4r6c0e2pdcqsgnkxaa3ql2xpee6p'
        }

        const result = await utilRoute.sweepWif(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(result, 'test-txid')
      })

      it('should throw 422 error if no non-token UTXOs', async () => {
        sandbox
          .stub(utilRoute.electrumx, '_balanceFromElectrumx')
          .resolves(mockData.mockBalance)

        sandbox
          .stub(utilRoute.electrumx, '_utxosFromElectrumx')
          .resolves(mockData.mockUtxos)

        // Force token utxo to appear as regular BCH utxo.
        sandbox
          .stub(utilRoute.bchjs.SLP.Utils, 'tokenUtxoDetails')
          .resolves(mockData.tokensOnly)

        // Mock sendRawTransaction() so that the hex does not actually get broadcast
        // to the network.
        sandbox
          .stub(utilRoute.bchjs.RawTransactions, 'sendRawTransaction')
          .resolves('test-txid')

        req.body = {
          wif: 'L5GEFg1tETLWBugmhSo9Zc4ms968qVmfmTroDxsJ982AiudAQGyt',
          toAddr: 'bitcoincash:qz2qn6zt4qmacf4r6c0e2pdcqsgnkxaa3ql2xpee6p'
        }

        const result = await utilRoute.sweepWif(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(res.statusCode, 422)
        assert.property(result, 'error')
        assert.include(
          result.error,
          'Tokens found, but no BCH UTXOs found. Add BCH to wallet to move tokens'
        )
      })

      it('should detect and throw error for multiple token classes', async () => {
        sandbox
          .stub(utilRoute.electrumx, '_balanceFromElectrumx')
          .resolves(mockData.mockBalance)

        sandbox
          .stub(utilRoute.electrumx, '_utxosFromElectrumx')
          .resolves(mockData.mockThreeUtxos)

        // Force token utxo to appear as regular BCH utxo.
        sandbox
          .stub(utilRoute.bchjs.SLP.Utils, 'tokenUtxoDetails')
          .resolves(mockData.multipleTokens)

        // Mock sendRawTransaction() so that the hex does not actually get broadcast
        // to the network.
        sandbox
          .stub(utilRoute.bchjs.RawTransactions, 'sendRawTransaction')
          .resolves('test-txid')

        req.body = {
          wif: 'L5GEFg1tETLWBugmhSo9Zc4ms968qVmfmTroDxsJ982AiudAQGyt',
          toAddr: 'bitcoincash:qz2qn6zt4qmacf4r6c0e2pdcqsgnkxaa3ql2xpee6p'
        }

        const result = await utilRoute.sweepWif(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(res.statusCode, 422)
        assert.property(result, 'error')
        assert.include(
          result.error,
          'Multiple token classes detected. This function only supports a single class of token'
        )
      })
    }
  })
})
