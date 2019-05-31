/*
  TESTS FOR THE BITCORE.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const bitcoreRoute = require("../../src/routes/v3/bitcore")
const nock = require("nock") // HTTP mocking

let originalUrl // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/bitcore-mock")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Bitcore Router", () => {
  let req, res

  before(() => {
    originalUrl = process.env.BITCORE_URL

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit")
      process.env.BITCORE_URL = "http://fakeurl/api/"

    // console.log(`Testing type is: ${process.env.TEST}`)
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
    process.env.BITCORE_URL = originalUrl
  })

  describe("#root", () => {
    // root route handler.
    const root = bitcoreRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "address", "Returns static string")
    })
  })

  describe("#Balance Single", () => {
    // details route handler.
    const balanceSingle = bitcoreRoute.testableComponents.balanceSingle

    it("should throw 400 if address is empty", async () => {
      const result = await balanceSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCORE_URL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BITCORE_URL = "http://fakeurl/api/"

        const result = await balanceSingle(req, res)

        // Restore the saved URL.
        process.env.BITCORE_URL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCORE_URL = savedUrl
      }
    })

    it("should get balance for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCORE_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockBalance)
      }

      // Call the details API.
      const result = await balanceSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["confirmed", "unconfirmed", "balance"])
      assert.isNumber(result.confirmed)
      assert.isNumber(result.unconfirmed)
      assert.isNumber(result.balance)
    })
    /*
  describe("#Balance Bulk", () => {
    // details route handler.
    const detailsBulk = bitcoreRoute.testableComponents.detailsBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        address: `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`
      }

      const result = await detailsBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
      }

      const result = await detailsBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result = await detailsBulk(req, res)
        //console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.isAbove(res.statusCode, 499, "HTTP status code 500 expected.")
        //assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          "Network error: Could not communicate",
          "Error message expected"
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert current page defaults to 0
      assert.equal(result[0].currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`],
        page: 5
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=5000&to=6000`)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert current page is same as requested
      assert.equal(result[0].currentPage, 5)
    })

    it("should calculate the total number of pages", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result[0].pagesTotal, 1)
    })

    it("should get details for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.equal(result.length, 1, "Array with one entry")
      assert.hasAllKeys(result[0], [
        "balance",
        "balanceSat",
        "totalReceived",
        "totalReceivedSat",
        "totalSent",
        "totalSentSat",
        "unconfirmedBalance",
        "unconfirmedBalanceSat",
        "unconfirmedTxApperances",
        "txApperances",
        "transactions",
        "legacyAddress",
        "cashAddress",
        "currentPage",
        "pagesTotal"
      ])
    })

    it("should get details for multiple addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockData.mockAddressDetails)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mwJnEzXzKkveF2q5Af9jxi9j1zrtWAnPU8?from=0&to=1000`)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
    */
  })
})
