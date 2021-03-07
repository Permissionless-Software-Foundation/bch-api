/*
  Unit tests for the route-ratelimit2.js middleware.
*/

'use strict'

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Mocking data.
const { mockReq, mockRes, mockNext } = require('./mocks/express-mocks')

// Libraries under test
const RateLimits = require('../../src/middleware/route-ratelimit2')
let uut = new RateLimits()

let req, res, next

describe('#rate-routelimit2', () => {
  let sandbox

  before(async () => {
    if (!process.env.JWT_AUTH_SERVER) {
      process.env.JWT_AUTH_SERVER = 'http://fakeurl.com/'
    }

    // Wipe the Redis DB, which prevents false negatives when running integration
    // tests back-to-back.
    await uut.wipeRedis()
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = cloneDeep(mockReq)
    res = cloneDeep(mockRes)
    next = mockNext

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}
    req.locals = {}

    sandbox = sinon.createSandbox()

    uut = new RateLimits()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    uut.closeRedis()
  })

  describe('#checkInternalIp', () => {
    it('should return true for a request from localhost', () => {
      req.ip = '::ffff:127.0.0.1'

      const result = uut.checkInternalIp(req)

      assert.equal(result, true)
    })

    it('should return true for a request from a Docker container', () => {
      req.ip = '172.17.0.3'

      const result = uut.checkInternalIp(req)

      assert.equal(result, true)
    })

    it('should return false for a random ip address', () => {
      req.ip = '123.456.7.8'

      const result = uut.checkInternalIp(req)

      assert.equal(result, false)
    })

    it('should return false when an error is encountered', () => {
      req.ip = 4

      const result = uut.checkInternalIp(req)

      assert.equal(result, false)
    })
  })

  describe('#isInWhitelist', () => {
    it('should return false when no argument is passed in', () => {
      const result = uut.isInWhitelist()

      assert.equal(result, false)
    })

    it('should return false when origin is not in the whitelist', () => {
      req.origin = 'blah.com'
      req.get = sandbox.stub().returns(req.origin)

      const result = uut.isInWhitelist(req)

      assert.equal(result, false)

      // Used to appease linter. Remove these.
      res.blah = 4
      next()
    })

    it('should return true when origin is in the whitelist', () => {
      req.origin = 'message.fullstack.cash'
      req.get = sandbox.stub().returns(req.origin)

      const result = uut.isInWhitelist(req)

      assert.equal(result, true)
    })
  })

  describe('#trackRateLimits', () => {
    it('should apply anonymous rate limits if no JWT token is provided', async () => {
      req.ip = '127.0.0.1'

      const result = await uut.trackRateLimits(req, res)
      // console.log(`result: `, result)

      // console.log('res.locals.pointsToConsume: ', res.locals.pointsToConsume)

      assert.equal(result, false, 'Rate limits not exceeded')
      assert.equal(
        res.locals.pointsToConsume,
        50,
        'Anonymous rate limits applied'
      )
    })

    it('should apply 100 RPM rate limits when JWT token is provided', async () => {
      // Generate a new JWT token for the test.
      const jwtPayload = {
        id: '5dade3f5739e6c0ff034b9a1',
        pointsToConsume: 10
      }
      const jwtToken = uut.generateJwtToken(jwtPayload)

      const result = await uut.trackRateLimits(req, res, jwtToken)
      // console.log(`result: `, result)

      // console.log('res.locals.pointsToConsume: ', res.locals.pointsToConsume)

      assert.equal(result, false, 'Rate limits not exceeded')
      assert.equal(res.locals.pointsToConsume, 10, '100 RPM limits applied')
    })
  })

  describe('#applyRateLimits', () => {
    it('should skip rate limits if basic auth token is used', async () => {
      req.locals.proLimit = true

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next to be called'
      )
    })

    it('should skip rate limits if internal call passes basic auth token', async () => {
      req.ip = '127.0.0.1'
      req.body.usrObj = {
        proLimit: true
      }

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next to be called'
      )
    })
  })
})
