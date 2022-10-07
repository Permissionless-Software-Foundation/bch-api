/*
  These integration tests need to be run against a live psf-slp-indexer.
*/

// Set environment variables needed to run this test.
process.env.SLP_INDEXER_API = 'http://192.168.2.129:5010/'
process.env.LOCAL_RESTURL = 'http://192.168.2.129:3000/v5/'

// Global npm libraries
const assert = require('chai').assert

// Local libraries
const PsfSlpIndexer = require('../../../src/routes/v5/psf-slp-indexer.js')
const { mockReq, mockRes } = require('../mocks/express-mocks')

describe('#psf-slp-indexer', () => {
  let req, res
  let uut

  beforeEach(async () => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    uut = new PsfSlpIndexer()
    await uut.initialize()
  })

  describe('#getTokenData2', () => {
    it('should get expanded token data', async () => {
      req.body.tokenId = '0e4543f820699294ab57e02ee2b1815a8bbc7b17a4333e4a138034e4b2324a61'

      const result = await uut.getTokenData2(req, res)
      console.log('result: ', result)

      assert.property(result, 'tokenStats')
      assert.property(result, 'mutableData')
      assert.property(result, 'immutableData')
      assert.property(result, 'tokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })
  })
})
