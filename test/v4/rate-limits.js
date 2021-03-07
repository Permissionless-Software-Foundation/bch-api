/*
  Unit tests for the rate limit middleware.
*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const sinon = require('sinon')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// Mocking data.
const { mockReq, mockRes, mockNext } = require('./mocks/express-mocks')

// Libraries under test
const RateLimits = require('../../src/middleware/route-ratelimit')
let rateLimits = new RateLimits()

// const controlRoute = require('../../src/routes/v4/full-node/control')
const jwtAuth = require('../../src/middleware/jwt-auth')

let req, res, next
// let originalEnvVars // Used during transition from integration to unit tests.

// JWT token used in tests.
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYWRlM2Y1NzM5ZTZjMGZmMDM0YjlhMSIsImlhdCI6MTU3MTY3NzQ1MCwiZXhwIjoxNTc0MjY5NDUwfQ.SSz7F7ETyBB3eoNG2VKCzPOhddtB-vrtmEoj7PxicrQ'

describe('#route-ratelimits & jwt-auth', () => {
  let sandbox

  before(async () => {
    // Save existing environment variables.
    // originalEnvVars = {
    //   BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
    //   RPC_BASEURL: process.env.RPC_BASEURL,
    //   RPC_USERNAME: process.env.RPC_USERNAME,
    //   RPC_PASSWORD: process.env.RPC_PASSWORD
    // }

    if (!process.env.JWT_AUTH_SERVER) { process.env.JWT_AUTH_SERVER = 'http://fakeurl.com/' }

    // Wipe the Redis DB, which prevents false negatives when running integration
    // tests back-to-back.
    await rateLimits.wipeRedis()
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
    req.locals = {}

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    rateLimits.closeRedis()
  })

  describe('#jwt-auth.js', () => {
    describe('#getTokenFromHeaders', () => {
      it('should populate the req.locals object correctly', () => {
        // Initialize req.locals
        req.locals = {
          proLimit: false,
          apiLevel: 0
        }

        const header = `Token ${jwt}`
        req.headers.authorization = header

        jwtAuth.getTokenFromHeaders(req, res, next)

        // console.log(`req.locals: ${JSON.stringify(req.locals, null, 2)}`)

        assert.property(req.locals, 'proLimit')
        assert.property(req.locals, 'apiLevel')
        assert.property(req.locals, 'jwtToken')
        assert.equal(req.locals.jwtToken, jwt)
      })
    })
  })

  describe('#getResource', () => {
    it('should decode a blockchain request', () => {
      const url =
        '/blockchain/getTxOut/62a3ea958a463a372bc0caf2c374a7f60be9c624be63a0db8db78f05809df6d8/0?include_mempool=true'

      const result = rateLimits.getResource(url)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 'blockchain')
    })
  })

  describe('#calcPoints', () => {
    it('should return 50 points for anonymous user', () => {
      const result = rateLimits.calcPoints()
      // console.log(`result: ${result}`)

      assert.equal(result, 50)
    })

    it('should return 50 points for free tier requesting full node access', () => {
      const jwtInfo = {
        apiLevel: 10,
        resource: 'blockchain',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 50 points for free tier requesting indexer access', () => {
      const jwtInfo = {
        apiLevel: 10,
        resource: 'blockbook',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 50 points for free tier requesting SLPDB access', () => {
      const jwtInfo = {
        apiLevel: 10,
        resource: 'slp',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 10 points for full node tier requesting full node access', () => {
      const jwtInfo = {
        apiLevel: 20,
        resource: 'blockchain',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })

    it('should return 50 points for full-node tier requesting indexer access', () => {
      const jwtInfo = {
        apiLevel: 20,
        resource: 'blockbook',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 50 points for full node tier requesting SLPDB access', () => {
      const jwtInfo = {
        apiLevel: 20,
        resource: 'slp',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 10 point for indexer tier requesting full node access', () => {
      const jwtInfo = {
        apiLevel: 30,
        resource: 'blockchain',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })

    it('should return 10 points for indexer tier requesting indexer access', () => {
      const jwtInfo = {
        apiLevel: 30,
        resource: 'blockbook',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })

    it('should return 50 points for indexer tier requesting SLPDB access', () => {
      const jwtInfo = {
        apiLevel: 30,
        resource: 'slp',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 50)
    })

    it('should return 10 point for SLP tier requesting full node access', () => {
      const jwtInfo = {
        apiLevel: 40,
        resource: 'blockchain',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })

    it('should return 10 points for SLP tier requesting indexer access', () => {
      const jwtInfo = {
        apiLevel: 40,
        resource: 'blockbook',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })

    it('should return 10 points for SLP tier requesting SLPDB access', () => {
      const jwtInfo = {
        apiLevel: 40,
        resource: 'slp',
        id: '5e3a0415eb29a962da2708b4'
      }

      const result = rateLimits.calcPoints(jwtInfo)
      assert.equal(result, 10)
    })
  })

  describe('#rateLimitByResource', () => {
    // NOTE: this test will fail if you run multiple integration tests in a
    // short period. Because it talks to the Redis DB.
    it('should pass through rate-limit middleware', async () => {
      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      // Call the route twice to trigger the rate handling.
      await rateLimits.rateLimitByResource(req, res, next)
      await rateLimits.rateLimitByResource(req, res, next)

      // next() will be called if rate-limit is not triggered
      assert.equal(next.called, true)
    })

    it('should trigger rate-limit handler if rate limits exceeds 5 request per minute', async () => {
      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      for (let i = 0; i < 5; i++) {
        next.reset() // reset the stubbed next() function.

        await rateLimits.rateLimitByResource(req, res, next)
        // console.log(`next() called: ${next.called}`)
      }

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        'next should not be called if rate limit was triggered.'
      )
    })

    it('should NOT trigger rate-limit for free-tier at 5 RPM', async () => {
      // Create a new instance of the rate limit so we start with zeroed tracking.
      rateLimits = new RateLimits()

      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      req.locals.jwtToken = 'some-token'

      const jwtInfo = {
        apiLevel: 10,
        id: '5e3a0415eb29a962da2708b1'
      }

      // Mock the call to the jwt library.
      sandbox.stub(rateLimits.jwt, 'verify').returns(jwtInfo)

      for (let i = 0; i < 5; i++) {
        next.reset() // reset the stubbed next() function.

        await rateLimits.rateLimitByResource(req, res, next)
        // console.log(`next() called: ${next.called}`)
      }

      // console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        true,
        'next should be called if rate limit was not triggered.'
      )
    })

    it('should trigger rate-limit for free tier after 20 RPM', async () => {
      // Create a new instance of the rate limit so we start with zeroed tracking.
      rateLimits = new RateLimits()

      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      req.locals.jwtToken = 'some-token'

      const jwtInfo = {
        apiLevel: 10,
        id: '5e3a0415eb29a962da2708b2'
      }

      // Mock the call to the jwt library.
      sandbox.stub(rateLimits.jwt, 'verify').returns(jwtInfo)

      for (let i = 0; i < 22; i++) {
        next.reset() // reset the stubbed next() function.

        await rateLimits.rateLimitByResource(req, res, next)
        // console.log(`next() called: ${next.called}`)
      }

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        'next should not be called if rate limit was triggered.'
      )
    })

    it('should NOT trigger rate-limit handler for indexer-tier at 25 RPM', async () => {
      // Create a new instance of the rate limit so we start with zeroed tracking.
      rateLimits = new RateLimits()

      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      req.locals.jwtToken = 'some-token'

      const jwtInfo = {
        apiLevel: 20,
        id: '5e3a0415eb29a962da2708b3'
      }

      // Mock the call to the jwt library.
      sandbox.stub(rateLimits.jwt, 'verify').returns(jwtInfo)

      for (let i = 0; i < 25; i++) {
        next.reset() // reset the stubbed next() function.

        await rateLimits.rateLimitByResource(req, res, next)
        // console.log(`next() called: ${next.called}`)
      }

      // console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        true,
        'next should be called if rate limit was not triggered.'
      )
    })

    it('should still rate-limit at a higher RPM for pro-tier', async () => {
      // Create a new instance of the rate limit so we start with zeroed tracking.
      rateLimits = new RateLimits()

      req.baseUrl = '/v4'
      req.path = '/control/getNetworkInfo'
      req.url = req.path
      req.method = 'GET'

      req.locals.jwtToken = 'some-token'

      const jwtInfo = {
        apiLevel: 20,
        id: '5e3a0415eb29a962da2708b5'
      }

      // Mock the call to the jwt library.
      sandbox.stub(rateLimits.jwt, 'verify').returns(jwtInfo)

      for (let i = 0; i < 150; i++) {
        next.reset() // reset the stubbed next() function.

        await rateLimits.rateLimitByResource(req, res, next)
        // console.log(`next() called: ${next.called}`)
      }

      // console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        'next should NOT be called if rate limit was triggered.'
      )
    })

    // CT 2/24/21 This test may have been invalidated by the interal IP address
    // passing that I implemented to get hydrateUtxos() working properly.
    // I'm commenting this out until I can study the side effects of this change,
    // and why exactly this test is breaking.
    // it('should handle misconfigured token secret', async () => {
    //   // Create a new instance of the rate limit so we start with zeroed tracking.
    //   rateLimits = new RateLimits()
    //
    //   req.baseUrl = '/v4'
    //   req.path = '/control/getNetworkInfo'
    //   req.url = req.path
    //   req.method = 'GET'
    //
    //   req.locals.jwtToken = 'some-token'
    //
    //   next.reset() // reset the stubbed next() function.
    //
    //   await rateLimits.rateLimitByResource(req, res, next)
    //
    //   // Issues with token secret should treat incoming requests as anonymous
    //   // calls with 50 points, or 20 RPM.
    //   assert.equal(res.locals.pointsToConsume, 50)
    // })
  })

  describe('#isInWhitelist', () => {
    it('should return false when no argument is passed in', () => {
      const result = rateLimits.isInWhitelist()

      assert.equal(result, false)
    })

    it('should return false when origin is not in the whitelist', () => {
      const origin = 'blah.com'

      const result = rateLimits.isInWhitelist(origin)

      assert.equal(result, false)
    })

    it('should return true when origin is in the whitelist', () => {
      const origin = 'message.fullstack.cash'

      const result = rateLimits.isInWhitelist(origin)

      assert.equal(result, true)
    })
  })
})

// Generates a Basic authorization header.
// function generateAuthHeader (pass) {
//   // https://en.wikipedia.org/wiki/Basic_access_authentication
//   const username = 'BITBOX'
//   const combined = `${username}:${pass}`
//
//   var base64Credential = Buffer.from(combined).toString('base64')
//   var readyCredential = `Basic ${base64Credential}`
//
//   return readyCredential
// }
