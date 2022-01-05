/*
  TESTS FOR THE XPUB.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const xpubRoute = require('../../src/routes/v5/xpub')
const nock = require('nock') // HTTP mocking

// let originalUrl // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
// const mockData = require('./mocks/address-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#XPUBRouter', () => {
  let req, res

  before(() => {
    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = 'unit'
    // if (process.env.TEST === "unit")
    //  process.env.BITCOINCOM_BASEURL = "http://fakeurl/api
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
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()
  })

  after(() => {
    // process.env.BITCOINCOM_BASEURL = originalUrl
  })

  describe('#root', () => {
    // root route handler.
    const root = xpubRoute.testableComponents.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'address', 'Returns static string')
    })
  })

  describe('#FromXPubSingle', () => {
    // details route handler.
    const fromXPubSingle = xpubRoute.testableComponents.fromXPubSingle

    it('should throw 400 if xpub is empty', async () => {
      const result = await fromXPubSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'xpub can not be empty')
    })

    it('should error on an array', async () => {
      req.params.xpub = [
        'tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM'
      ]

      const result = await fromXPubSingle(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'xpub can not be an array',
        'Proper error message'
      )
    })
    /*
    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.xpub = `tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result = await fromXPubSingle(req, res)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })
*/
    it('should create an address from xpub', async () => {
      req.params.xpub =
        'tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM'

      // Mock the Insight URL for unit tests.
      // TODO add unit test
      // if (process.env.TEST === "unit") {
      //   nock(`${process.env.BITCOINCOM_BASEURL}`)
      //     .get(
      //       `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
      //     )
      //     .reply(200, mockData.mockTransactions)
      // }

      // Call the details API.
      const result = await fromXPubSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.exists(result.legacyAddress)
      assert.exists(result.cashAddress)
    })
  })
})
