/*
  These integration tests need to be run against a live SLPDB. They query
  against a live SLPDB and test the results against known token stats.
 */

'use strict'

const chai = require('chai')
const assert = chai.assert
// const axios = require('axios')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// Exit if SLPDB URL is not defined.
if (!process.env.SLPDB_URL) {
  throw new Error(
    'SLPDB_URL and SLPDB_PASS must be defined in order to run these tests.'
  )
}

const SLP = require('../../../src/routes/v4/slp')
const slp = new SLP()

const { mockReq, mockRes } = require('../mocks/express-mocks')

describe('#nft', () => {
  let req, res

  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes
  })

  describe('#getNftChildren', () => {
    it('should return error on non-existing NFT group token', async () => {
      req.params.tokenId =
        '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0b'
      const result = await slp.getNftChildren(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.include(
        result.error,
        'NFT group does not exists',
        'Error message expected'
      )
    })
    it('should return error on non-group NFT token', async () => {
      req.params.tokenId =
        '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9'

      const result = await slp.getNftChildren(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.include(
        result.error,
        'NFT group does not exists',
        'Error message expected'
      )
    })
    it('should get NFT children list', async () => {
      req.params.tokenId =
        '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a'

      const result = await slp.getNftChildren(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result.nftChildren)
      assert.equal(result.nftChildren.length, 2)
      assert.equal(
        result.nftChildren[0],
        '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9'
      )
      assert.equal(
        result.nftChildren[1],
        '928ce61fe1006b1325a0ba0dce700bf83986a6f0691ba26e121c9ac035d12a55'
      )
    })
  })

  describe('#getNftGroup', () => {
    it('should return error on non-existing NFT child token', async () => {
      req.params.tokenId =
        '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a8'
      const result = await slp.getNftGroup(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.include(
        result.error,
        'NFT child does not exists',
        'Error message expected'
      )
    })
    it('should get NFT group token info', async () => {
      req.params.tokenId =
        '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9'
      // req.params.tokenId = '928ce61fe1006b1325a0ba0dce700bf83986a6f0691ba26e121c9ac035d12a55'
      const result = await slp.getNftGroup(req, res)
      // console.log(`result: ${util.inspect(result)}`)
      assert.property(result, 'nftGroup')
      assert.property(result.nftGroup, 'id')
      assert.property(result.nftGroup, 'versionType')
      assert.property(result.nftGroup, 'symbol')
      assert.equal(
        result.nftGroup.id,
        '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a'
      )
      assert.equal(result.nftGroup.versionType, 129)
      assert.equal(result.nftGroup.symbol, 'PSF.TEST.GROUP')
    })
  })
})
