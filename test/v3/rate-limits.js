"use strict"

const chai = require("chai")
const assert = chai.assert
const nock = require("nock") // HTTP mocking

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// Mocking data.
const { mockReq, mockRes, mockNext } = require("./mocks/express-mocks")

// Libraries under test
let rateLimitMiddleware = require("../../src/middleware/route-ratelimit")
const controlRoute = require("../../src/routes/v3/full-node/control")
const jwtAuth = require("../../src/middleware/jwt-auth")

let req, res, next
let originalEnvVars // Used during transition from integration to unit tests.

// JWT token used in tests.
const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYWRlM2Y1NzM5ZTZjMGZmMDM0YjlhMSIsImlhdCI6MTU3MTY3NzQ1MCwiZXhwIjoxNTc0MjY5NDUwfQ.SSz7F7ETyBB3eoNG2VKCzPOhddtB-vrtmEoj7PxicrQ`

describe("#route-ratelimits & jwt-auth", () => {
  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    if (!process.env.JWT_AUTH_SERVER)
      process.env.JWT_AUTH_SERVER = `http://fakeurl.com/`
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = Object.assign({}, mockReq)
    res = Object.assign({}, mockRes)
    next = mockNext

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}
  })

  describe("#jwt-auth.js", () => {
    describe("#getTokenFromHeaders", () => {
      it(`should populate the req.locals object correctly`, () => {
        // Initialize req.locals
        req.locals = {
          proLimit: false,
          apiLevel: 0
        }

        const header = `Token ${jwt}`
        req.headers.authorization = header

        jwtAuth.getTokenFromHeaders(req, res, next)

        // console.log(`req.locals: ${JSON.stringify(req.locals, null, 2)}`)

        assert.property(req.locals, "proLimit")
        assert.property(req.locals, "apiLevel")
        assert.property(req.locals, "jwtToken")
        assert.equal(req.locals.jwtToken, jwt)
      })
    })

    // TODO: This code has been refactored and these unit tests no longer apply.
    // I think I forgot to create new unit tests to reflect the change in code though.
    /*
    describe("#routeAccess", () => {
      it("should do nothing if req.locals.jwtToken is undefined", () => {
        // Initialize req.locals
        req.locals = {
          proLimit: false,
          apiLevel: 0
        }
        req.url = "/insight/address/details"

        // Reset the history of the stub and assert it has not been called.
        res.status.resetHistory()
        assert.equal(res.status.called, false, "stub history reset")

        jwtAuth.routeAccess(req, res, next)

        // console.log(`req.locals: ${JSON.stringify(req.locals, null, 2)}`)
        assert.equal(
          res.status.called,
          false,
          "stub should NOT have been called."
        )
      })

      it("should throw error if full-node tier tries to access indexer", () => {
        // Initialize req.locals
        req.locals = {
          proLimit: true,
          apiLevel: 10,
          jwtToken: jwt
        }
        req.url = "/insight/address/details"

        try {
          res.status.resetHistory()
          assert.equal(res.status.called, false, "stub history reset")

          jwtAuth.routeAccess(req, res, next)

          assert.equal(res.status.called, true, "stub should have been called.")
        } catch (err) {
          console.log(`caught error: `, err)
        }
      })

      it("should allow indexer tier tries access indexer endpoints", () => {
        // Initialize req.locals
        req.locals = {
          proLimit: true,
          apiLevel: 20,
          jwtToken: jwt
        }
        req.url = "/insight/address/details"

        try {
          res.status.resetHistory()
          assert.equal(res.status.called, false, "stub history reset")

          jwtAuth.routeAccess(req, res, next)

          assert.equal(
            res.status.called,
            false,
            "stub should NOT have been called."
          )
        } catch (err) {
          console.log(`caught error: `, err)
        }
      })
    })
    */
  })

  describe("#routeRateLimit", () => {
    let routeRateLimit = rateLimitMiddleware.routeRateLimit
    const getInfo = controlRoute.testableComponents.getInfo

    it("should pass through rate-limit middleware", async () => {
      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      // Call the route twice to trigger the rate handling.
      await routeRateLimit(req, res, next)
      await routeRateLimit(req, res, next)

      // next() will be called if rate-limit is not triggered
      assert.equal(next.called, true)
    })

    it("should trigger rate-limit handler if rate limits exceeds 5 request per minute", async () => {
      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      for (let i = 0; i < 5; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        `next should not be called if rate limit was triggered.`
      )
    })

    it("should NOT trigger rate-limit for free-tier at 5 RPM", async () => {
      // Clear the require cache before running this test.
      delete require.cache[
        require.resolve("../../src/middleware/route-ratelimit")
      ]
      rateLimitMiddleware = require("../../src/middleware/route-ratelimit")
      routeRateLimit = rateLimitMiddleware.routeRateLimit

      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      req.locals.proLimit = true
      req.locals.apiLevel = 0

      for (let i = 0; i < 5; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      //console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        true,
        `next should be called if rate limit was not triggered.`
      )
    })

    it("should trigger rate-limit for free tier 10 RPM", async () => {
      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      req.locals.proLimit = true
      req.locals.apiLevel = 0

      for (let i = 0; i < 12; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        `next should not be called if rate limit was triggered.`
      )
    })

    it("should NOT trigger rate-limit handler for pro-tier at 25 RPM", async () => {
      // Clear the require cache before running this test.
      delete require.cache[
        require.resolve("../../src/middleware/route-ratelimit")
      ]
      rateLimitMiddleware = require("../../src/middleware/route-ratelimit")
      routeRateLimit = rateLimitMiddleware.routeRateLimit

      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      req.locals.proLimit = true
      req.locals.apiLevel = 10

      for (let i = 0; i < 25; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      //console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        true,
        `next should be called if rate limit was not triggered.`
      )
    })

    it("rate-limiting should still kick in at a higher RPM for pro-tier", async () => {
      // Clear the require cache before running this test.
      delete require.cache[
        require.resolve("../../src/middleware/route-ratelimit")
      ]
      rateLimitMiddleware = require("../../src/middleware/route-ratelimit")
      routeRateLimit = rateLimitMiddleware.routeRateLimit

      req.baseUrl = "/v3"
      req.path = "/control/getNetworkInfo"
      req.method = "GET"

      req.locals.proLimit = true
      req.locals.apiLevel = 10

      for (let i = 0; i < 150; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      //console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        `next should NOT be called if rate limit was triggered.`
      )
    })
  })
})

// Generates a Basic authorization header.
function generateAuthHeader(pass) {
  // https://en.wikipedia.org/wiki/Basic_access_authentication
  const username = "BITBOX"
  const combined = `${username}:${pass}`

  var base64Credential = Buffer.from(combined).toString("base64")
  var readyCredential = `Basic ${base64Credential}`

  return readyCredential
}
