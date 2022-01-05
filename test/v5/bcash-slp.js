/*
  TESTS FOR THE bcash/slp.js LIBRARY
*/

'use strict'

const chai = require('chai')
const assert = chai.assert

const sinon = require('sinon')

const BcashSlp = require('../../src/routes/v5/bcash/slp')

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/bcash-slp-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

if (!process.env.BCASH_SERVER) process.env.BCASH_SERVER = 'http://localhost'

describe('#bcash-slp', () => {
  let req, res
  let sandbox
  const bcashSlp = new BcashSlp()
  // let electrumxRoute

  before(async () => {
    if (!process.env.TEST) {
      process.env.TEST = 'unit'
    }
    console.log(`Testing type is: ${process.env.TEST}`)

    if (!process.env.NETWORK) process.env.NETWORK = 'testnet'

    // Connect to electrumx servers if this is an integration test.
    // if (process.env.TEST === 'integration') {
    //   await electrumxRoute.connect()
    //   console.log('Connected to ElectrumX server')
    // }
  })

  after(async () => {
    // console.log(`electrumxRoute.electrumx: `, electrumxRoute.electrumx)
    // Disconnect from the electrumx server if this is an integration test.
    // if (process.env.TEST === 'integration') {
    //   await electrumxRoute.disconnect()
    //   console.log('Disconnected from ElectrumX server')
    // }
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

    // electrumxRoute = new ElecrumxRoute()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    //
  })

  describe('#root', () => {
    // root route handler.
    const root = bcashSlp.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'bcash-slp', 'Returns static string')
    })
  })

  describe('#getUtxos', () => {
    it('should return UTXOs for an address, hydrated with SLP info', async () => {
      sandbox.stub(bcashSlp.axios, 'get').resolves({ data: mockData.utxos })
      sandbox.stub(bcashSlp, 'getTokenInfo').resolves(mockData.tokenInfo)
      req.params.address =
        'bitcoincash:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk'

      const utxos = await bcashSlp.getUtxos(req, res)
      assert.isArray(utxos)
      const utxo = utxos[0]

      assert.property(utxo, 'version')
      assert.property(utxo, 'height')
      assert.property(utxo, 'value')
      assert.property(utxo, 'script')
      assert.property(utxo, 'address')
      assert.property(utxo, 'coinbase')
      assert.property(utxo, 'hash')
      assert.property(utxo, 'index')
      assert.property(utxo, 'slp')

      assert.property(utxo.slp, 'tokenId')
      assert.property(utxo.slp, 'ticker')
      assert.property(utxo.slp, 'name')
      assert.property(utxo.slp, 'uri')
      assert.property(utxo.slp, 'hash')
      assert.property(utxo.slp, 'decimals')
      assert.property(utxo.slp, 'vout')
      assert.property(utxo.slp, 'value')
      assert.property(utxo.slp, 'type')
    })
    it('should handle error if address is array', async () => {
      req.params.address = [
        'bchtest:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk'
      ]

      const result = await bcashSlp.getUtxos(req, res)
      assert.include(
        result.error,
        'address can not be an array. Use POST for bulk upload.'
      )
    })
    it('should throw error if address has invalid format', async () => {
      sandbox.stub(bcashSlp.routeUtils, 'validateNetwork').returns(false)

      req.params.address = 'qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk'

      const result = await bcashSlp.getUtxos(req, res)
      assert.include(
        result.error,
        'Invalid network. Trying to use a testnet address on mainnet'
      )
    })
    it('should catch axios error', async () => {
      sandbox.stub(bcashSlp.axios, 'get').throws(new Error('test error'))
      req.params.address =
        'bitcoincash:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk'
      const result = await bcashSlp.getUtxos(req, res)
      assert.include(result.error, 'test error')
    })
  })

  describe('#hydrateUTXOS', () => {
    it('should hydrate slp utxos', async () => {
      sandbox.stub(bcashSlp, 'getTokenInfo').resolves(mockData.tokenInfo)

      const hydratedUtxos = await bcashSlp.hydrateUTXOS(mockData.utxos)
      assert.isArray(hydratedUtxos)
      const hydratedUtxo = hydratedUtxos[0]
      assert.property(hydratedUtxo, 'version')
      assert.property(hydratedUtxo, 'height')
      assert.property(hydratedUtxo, 'value')
      assert.property(hydratedUtxo, 'script')
      assert.property(hydratedUtxo, 'address')
      assert.property(hydratedUtxo, 'coinbase')
      assert.property(hydratedUtxo, 'hash')
      assert.property(hydratedUtxo, 'index')
      assert.property(hydratedUtxo, 'slp')

      assert.property(hydratedUtxo.slp, 'tokenId')
      assert.property(hydratedUtxo.slp, 'ticker')
      assert.property(hydratedUtxo.slp, 'name')
      assert.property(hydratedUtxo.slp, 'uri')
      assert.property(hydratedUtxo.slp, 'hash')
      assert.property(hydratedUtxo.slp, 'decimals')
      assert.property(hydratedUtxo.slp, 'vout')
      assert.property(hydratedUtxo.slp, 'value')
      assert.property(hydratedUtxo.slp, 'type')
    })

    it('should throw error if utxos is not provided', async () => {
      try {
        await bcashSlp.hydrateUTXOS()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'UTXOs must be an array of slp utxos')
      }
    })
    it('should handle error', async () => {
      try {
        sandbox.stub(bcashSlp, 'getTokenInfo').throws(new Error('test error'))

        await bcashSlp.getTokenInfo(mockData.utxos)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'test error')
      }
    })
  })

  describe('#getTokenInfo', () => {
    it('should return SLP info for an token id', async () => {
      sandbox.stub(bcashSlp.axios, 'get').resolves({ data: mockData.tokenInfo })

      const tokenId =
        'afd88e9afab110e7b75410417edb5c98798c08aa892cee8d97b44f2e5545a900'
      const slpInfo = await bcashSlp.getTokenInfo(tokenId)
      assert.isObject(slpInfo)
      assert.property(slpInfo, 'tokenId')
      assert.property(slpInfo, 'ticker')
      assert.property(slpInfo, 'name')
      assert.property(slpInfo, 'uri')
      assert.property(slpInfo, 'hash')
      assert.property(slpInfo, 'decimals')
    })
    it('should throw error if token id is not provided', async () => {
      try {
        await bcashSlp.getTokenInfo()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'tokenId must be string')
      }
    })
    it('should catch axios error', async () => {
      try {
        sandbox.stub(bcashSlp.axios, 'get').throws(new Error('test error'))
        const tokenId =
          'afd88e9afab110e7b75410417edb5c98798c08aa892cee8d97b44f2e5545a900'
        await bcashSlp.getTokenInfo(tokenId)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'test error')
      }
    })
  })
  describe('#errorHandler', () => {
    it('should handle unexpected errors', () => {
      sandbox.stub(bcashSlp.routeUtils, 'decodeError').returns({ msg: false })

      const result = bcashSlp.errorHandler(new Error('test error'), res)
      // console.log('result: ', result)
      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.property(result, 'error')
    })
  })
})
