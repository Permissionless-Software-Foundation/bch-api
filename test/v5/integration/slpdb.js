/*
  These integration tests need to be run against a live SLPDB. They query
  against a live SLPDB and test the results against known token stats.
 */

'use strict'

// const chai = require('chai')
// const assert = chai.assert
// const axios = require('axios')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// Exit if SLPDB URL is not defined.
if (!process.env.SLPDB_URL) {
  throw new Error('SLPDB_URL and SLPDB_PASS must be defined in order to run these tests.')
}

const SLPDB = require('../../../src/routes/v4/services/slpdb')
const slpdb = new SLPDB()

describe('#slpdb', () => {
  describe('#getTotalCirculating', () => {
    it('should get circulating supply', async () => {
      const result = await slpdb.getTotalCirculating('b10677aef051b73e6b170c1c0824da33a3e0680ab5a01cd8d76aa77840fccfb4')
      console.log('result: ', result)
    })
  })
})
