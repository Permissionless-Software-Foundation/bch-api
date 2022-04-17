/*
  Unit tests for the route-ratelimit2.js middleware.
*/

'use strict'

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

const config = require('../../config')

// Mocking data.
const { mockReq, mockRes, mockNext } = require('./mocks/express-mocks')

// Libraries under test
const RateLimits = require('../../src/middleware/route-ratelimit')
let uut = new RateLimits()

let req, res, next

describe('#rate-routelimit', () => {
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

  describe('#decodeJwtToken', () => {
    it('should return the default JWT payload if decoding fails', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlODhhY2JmMDIyMWMxMDAxMmFkOTNmZiIsImVtYWlsIjoiY2hyaXMudHJvdXRuZXJAZ21haWwuY29tIiwiYXBpTGV2ZWwiOjQwLCJyYXRlTGltaXQiOjMsImlhdCI6MTYxNTE1NzA4NywiZXhwIjoxNjE3NzQ5MDg3fQ.RLNGuYAa-CcLdhTGD27tDeaxT6-GIdeR8T4JWZZLDZA'

      const result = uut.decodeJwtToken(jwt)
      // console.log('result: ', result)

      assert.property(result, 'id')
      // assert.equal(result.id, '123.456.789.10')
      assert.property(result, 'email')
      // assert.equal(result.email, 'test@bchtest.net')
      // assert.property(result, 'pointsToConsume')
      // assert.equal(result.pointsToConsume, config.anonRateLimit)
      // assert.property(result, 'duration')
      // assert.equal(result.duration, 30)
      assert.property(result, 'exp')
    })

    it('should return the default JWT payload if no input is given', () => {
      const result = uut.decodeJwtToken()
      // console.log('result: ', result)

      assert.property(result, 'id')
      assert.equal(result.id, '123.456.789.10')
      assert.property(result, 'email')
      assert.equal(result.email, 'test@bchtest.net')
      assert.property(result, 'pointsToConsume')
      assert.equal(result.pointsToConsume, config.anonRateLimit)
      assert.property(result, 'duration')
      assert.equal(result.duration, 30)
      assert.property(result, 'exp')
    })

    it('should correctly decode a JWT token', () => {
      // Generate a new JWT token for the test.
      const jwtPayload = {
        id: '5dade3f5739e6c0ff034b9a1',
        pointsToConsume: 10,
        email: 'gooduser@test.com',
        apiLevel: 40,
        rateLimit: 100,
        duration: 30
      }
      const jwtToken = uut.generateJwtToken(jwtPayload)

      const result = uut.decodeJwtToken(jwtToken)
      // console.log('result: ', result)

      assert.property(result, 'id')
      assert.equal(result.id, jwtPayload.id)
      assert.property(result, 'email')
      assert.equal(result.email, jwtPayload.email)
      assert.property(result, 'pointsToConsume')
      assert.equal(result.pointsToConsume, jwtPayload.pointsToConsume)
      assert.property(result, 'duration')
      assert.equal(result.duration, jwtPayload.duration)
      assert.property(result, 'exp')
    })

    it('should return the default payload if there is an unhandled error', () => {
      // Force an error.
      sandbox.stub(uut, 'generateJwtToken').throws(new Error('test error'))

      const result = uut.decodeJwtToken()
      // console.log('result: ', result)

      assert.property(result, 'id')
      assert.equal(result.id, '123.456.789.10')
      assert.property(result, 'email')
      assert.equal(result.email, 'test@bchtest.net')
      assert.property(result, 'pointsToConsume')
      assert.equal(result.pointsToConsume, config.anonRateLimit)
      assert.property(result, 'duration')
      assert.equal(result.duration, 30)
      assert.property(result, 'exp')
    })
  })

  describe('#trackRateLimits', () => {
    it('should apply anonymous rate limits if no JWT token is provided', async () => {
      // Mock sleep function
      sandbox.stub(uut, 'sleep').resolves()

      req.ip = '127.0.0.1'

      const result = await uut.trackRateLimits(req, res)
      // console.log(`result: `, result)

      // console.log('res.locals.pointsToConsume: ', res.locals.pointsToConsume)

      assert.equal(result, false, 'Rate limits not exceeded')
      assert.equal(
        res.locals.pointsToConsume,
        config.anonRateLimit,
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
        'Expecting next() to be called'
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
        'Expecting next() to be called'
      )
    })

    it('should apply rate limits to anonymous users', async () => {
      // Mock sleep function
      sandbox.stub(uut, 'sleep').resolves()

      req.ip = '123.456.7.8'

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next() to be called'
      )

      assert.equal(
        res.locals.pointsToConsume,
        config.anonRateLimit,
        'Anonymous rate limits applied'
      )
    })

    it('should return 429 error when anonymous users exceed rate limit', async () => {
      // Mock sleep function
      sandbox.stub(uut, 'sleep').resolves()

      req.ip = '123.456.7.8'

      // force req.locals.jwtToken to be empty.
      req.locals.jwtToken = undefined

      let val
      for (let i = 0; i < 25; i++) {
        // console.log('req.locals: ', req.locals)
        val = await uut.applyRateLimits(req, res, next)
      }
      // console.log('val: ', val)

      assert.property(val, 'error')
      assert.include(
        val.error,
        'Too many requests. Your limits are currently'
      )

      assert.equal(res.locals.rateLimitTriggered, true, 'Rate limits triggered')

      assert.equal(
        res.locals.pointsToConsume,
        config.anonRateLimit,
        'Anonymous rate limits applied'
      )
    })

    it('should apply rate limits when JWT token is provided', async () => {
      // Generate a new JWT token for the test.
      const jwtPayload = {
        id: '5dade3f5739e6c0ff034b9a1',
        pointsToConsume: 10
      }
      const jwtToken = uut.generateJwtToken(jwtPayload)

      req.ip = '123.456.7.8'
      req.locals.jwtToken = jwtToken

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next() to be called'
      )

      assert.equal(
        res.locals.pointsToConsume,
        10,
        'Anonymous rate limits applied'
      )
    })

    it('should apply internal rate limits to internal calls', async () => {
      req.ip = '127.0.0.1'

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next() to be called'
      )

      assert.equal(
        res.locals.pointsToConsume,
        10,
        'Internal rate limits applied'
      )
    })

    it('should return 429 error when internal calls exceed interal rate limit', async () => {
      req.ip = '127.0.0.1'

      let val
      for (let i = 0; i < 1025; i++) {
        val = await uut.applyRateLimits(req, res, next)
      }

      assert.property(val, 'error')
      assert.include(
        val.error,
        'Too many requests. Your limits are currently 1000 requests per minute.'
      )

      assert.equal(res.locals.rateLimitTriggered, true, 'Rate limits triggered')

      assert.equal(
        res.locals.pointsToConsume,
        10,
        'Internal rate limits applied'
      )
    })

    it('should apply JWT rate limits to internal calls when JWT passes through', async () => {
      // Generate a new JWT token for the test.
      const jwtPayload = {
        id: '5dade3f5739e6c0ff034b9a1',
        pointsToConsume: 10
      }
      const jwtToken = uut.generateJwtToken(jwtPayload)

      req.ip = '127.0.0.1'
      req.body.usrObj = {
        jwtToken
      }

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next() to be called'
      )

      assert.equal(
        res.locals.pointsToConsume,
        10,
        'User JWT rate limits applied'
      )
    })

    it('should return 429 error when internal calls using JWT pass-through exceeds rate limit', async () => {
      // Generate a new JWT token for the test.
      const jwtPayload = {
        id: '5dade3f5739e6c0ff034b9a1',
        pointsToConsume: 100
      }
      const jwtToken = uut.generateJwtToken(jwtPayload)

      req.ip = '127.0.0.1'
      req.body.usrObj = {
        jwtToken
      }

      try {
        let val
        for (let i = 0; i < 120; i++) {
          val = await uut.applyRateLimits(req, res, next)
        }
        // console.log('val: ', val)

        assert.property(val, 'error')
        assert.include(
          val.error,
          'Too many requests. Your limits are currently 100 requests per minute.'
        )

        assert.equal(
          res.locals.pointsToConsume,
          100,
          'User JWT rate limits applied'
        )
      } catch (err) {
        console.log('err: ', err)
        assert.fail('Unexpected result')
      }
    })

    it('should move to the next middleware when encountering an unexpected internal error', async () => {
      // Force the creation of the res and req locals property. Covers an
      // otherwise untested code path.
      req.locals = undefined
      res.locals = undefined

      // Force an error
      sandbox.stub(uut, 'checkInternalIp').throws(new Error('test error'))

      // console.log('next.callCount: ', next.callCount)
      const startCallCount = next.callCount

      await uut.applyRateLimits(req, res, next)

      // console.log('next.callCount: ', next.callCount)
      const endCallCount = next.callCount

      assert.isAbove(
        endCallCount,
        startCallCount,
        'Expecting next() to be called'
      )
    })
  })
})
