/*
  Integration tests for the price library.
 */

'use strict'

const assert = require('chai').assert
// const axios = require('axios')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const Price = require('../../../src/routes/v4/price')
const price = new Price()

const { mockReq, mockRes } = require('../mocks/express-mocks')

describe('#price', () => {
  let req, res

  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes
  })

  describe('#getUSD', () => {
    it('should get the USD price', async () => {
      const result = await price.getUSD(req, res)
      console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })

  describe('#getBCHAUSD', () => {
    it('should get the USD price of BCHA', async () => {
      const result = await price.getBCHAUSD(req, res)
      console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })
  describe('#getBCHUSD', () => {
    it('should get the USD price of BCH', async () => {
      const result = await price.getBCHUSD(req, res)
      console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result.usd)
    })
  })
})
