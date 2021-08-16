/*
  TESTS FOR THE JWT.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

*/

'use strict'

const chai = require('chai')
const assert = chai.assert
const JWTRoute = require('../../src/routes/v5/jwt')
const uut = new JWTRoute()
const sinon = require('sinon')

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
// const mockData = require('./mocks/control-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#JWTRouter', () => {
  let req, res
  let sandbox

  before(() => {
    // Set default environment variables for unit tests.
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
  })

  afterEach(() => {
    // Restore Sandbox
    sandbox.restore()
  })

  after(() => {})

  describe('#root', async () => {
    // root route handler.
    // const root = controlRoute.testableComponents.root

    it('should respond to GET for base route', async () => {
      const result = uut.root(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, 'jwt', 'Returns static string')
    })
  })

  describe('#jwtInfo', () => {
    it('should decode the JWT token', async () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZWM3NTY1YTM4ZjkyMjdlOWVjNTM3MCIsImVtYWlsIjoidGVzdHVzZXJAZ21haWwuY29tIiwiYXBpTGV2ZWwiOjAsInJhdGVMaW1pdCI6MywicG9pbnRzVG9Db25zdW1lIjo1MDAsImR1cmF0aW9uIjozMCwiaWF0IjoxNjI2MTA5MzQ4LCJleHAiOjE2Mjg3MDEzNDh9.hF8BKU-1SvlvQBnTNbB65ErQTtNSl-pWlRANSJY-Zb4'
      req.body.jwt = jwtToken

      const result = await uut.jwtInfo(req, res)
      // console.log('result: ', result)

      assert.equal(result.error, 'jwt expired')

      // assert.property(result, 'id')
      // assert.property(result, 'email')
      // assert.property(result, 'apiLevel')
      // assert.property(result, 'rateLimit')
      // assert.property(result, 'pointsToConsume')
      // assert.property(result, 'duration')
      // assert.property(result, 'iat')
      // assert.property(result, 'exp')
      // assert.property(result, 'expiration')
      // assert.property(result, 'createdAt')
    })

    it('should return an error with malformed JWT token', async () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiLsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZWM3NTY1YTM4ZjkyMjdlOWVjNTM3MCIsImVtYWlsIjoidGVzdHVzZXJAZ21haWwuY29tIiwiYXBpTGV2ZWwiOjAsInJhdGVMaW1pdCI6MywicG9pbnRzVG9Db25zdW1lIjo1MDAsImR1cmF0aW9uIjozMCwiaWF0IjoxNjI2MTA5MzQ4LCJleHAiOjE2Mjg3MDEzNDh9.hF8BKU-1SvlvQBnTNbB65ErQTtNSl-pWlRANSJY-Zb4'
      req.body.jwt = jwtToken

      const result = await uut.jwtInfo(req, res)
      // console.log('result: ', result)

      assert.equal(result.error, 'invalid token')
    })
  })
})
