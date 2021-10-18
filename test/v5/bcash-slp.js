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
// const mockData = require('./mocks/electrumx-mock')

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
      // TODO: Add unit tests.
      assert.isOk(true)
    })
  })
})
