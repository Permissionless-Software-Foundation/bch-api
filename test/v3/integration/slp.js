/*
  These integration tests need to be run against a live SLPDB. They query
  against a live SLPDB and test the results against known token stats.
 */

'use strict'

const assert = require('chai').assert
// const axios = require('axios')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// Exit if SLPDB URL is not defined.
if (!process.env.SLPDB_URL) {
  throw new Error('SLPDB_URL and SLPDB_PASS must be defined in order to run these tests.')
}

const SLP = require('../../../src/routes/v3/slp')
const slp = new SLP()

const { mockReq, mockRes } = require('../mocks/express-mocks')

describe('#slp', () => {
  let req, res

  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes
  })

  describe('#tokenStats', () => {
    it('should get token stats for token with no mint baton', async () => {
      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'
        // 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const result = await slp.tokenStats(req, res)
      console.log(`result: ${util.inspect(result)}`)

      // Assert that expected properties exist.
      assert.property(result, 'decimals')
      assert.property(result, 'timestamp')
      assert.property(result, 'versionType')
      assert.property(result, 'documentUri')
      assert.property(result, 'symbol')
      assert.property(result, 'name')
      assert.property(result, 'containsBaton')
      assert.property(result, 'id')
      assert.property(result, 'documentHash')
      assert.property(result, 'initialTokenQty')
      assert.property(result, 'blockCreated')
      assert.property(result, 'blockLastActiveSend')
      assert.property(result, 'blockLastActiveMint')
      assert.property(result, 'txnsSinceGenesis')
      assert.property(result, 'validAddresses')
      assert.property(result, 'mintingBatonStatus')
      assert.property(result, 'timestampUnix')
      assert.property(result, 'totalMinted')
      assert.property(result, 'totalBurned')
      assert.property(result, 'circulatingSupply')

      // baton was never created.
      assert.equal(result.containsBaton, false)
    })

    it('should get token stats for token with a mint baton', async () => {
      req.params.tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const result = await slp.tokenStats(req, res)
      console.log(`result: ${util.inspect(result)}`)

      // Assert that expected properties exist.
      assert.property(result, 'decimals')
      assert.property(result, 'timestamp')
      assert.property(result, 'versionType')
      assert.property(result, 'documentUri')
      assert.property(result, 'symbol')
      assert.property(result, 'name')
      assert.property(result, 'containsBaton')
      assert.property(result, 'id')
      assert.property(result, 'documentHash')
      assert.property(result, 'initialTokenQty')
      assert.property(result, 'blockCreated')
      assert.property(result, 'blockLastActiveSend')
      assert.property(result, 'blockLastActiveMint')
      assert.property(result, 'txnsSinceGenesis')
      assert.property(result, 'validAddresses')
      assert.property(result, 'mintingBatonStatus')
      assert.property(result, 'timestampUnix')
      assert.property(result, 'totalMinted')
      assert.property(result, 'totalBurned')
      assert.property(result, 'circulatingSupply')

      // baton was created.
      assert.equal(result.containsBaton, true)
    })
  })
})
