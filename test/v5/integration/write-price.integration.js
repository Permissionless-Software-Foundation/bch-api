/*
  Integration test for the write-price.js adapter library.
*/

const WritePrice = require('../../../src/routes/v5/minimal-slp-wallet/write-price.js')

describe('#WritePrice', () => {
  describe('#getPsffppWritePrice', () => {
    it('should get the current write price', async () => {
      const writePriceLib = new WritePrice()

      const writePrice = await writePriceLib.getPsffppWritePrice()
      console.log('writePrice: ', writePrice)
    })
  })
})
