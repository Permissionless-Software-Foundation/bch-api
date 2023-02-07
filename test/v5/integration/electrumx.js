/*
  Integration tests for the electrumx.js library.
*/

// Global npm libraries
const assert = require('chai').assert

// Local libraries
const { mockReq, mockRes } = require('../mocks/express-mocks')
const Electrum = require('../../../src/routes/v5/electrumx')

describe('#electrumx', () => {
  let req, res
  let uut // Unit under test

  before(() => {
    if (!process.env.FULCRUM_API) {
      process.env.FULCRUM_API = 'http://localhost:3001/v1/'
    }

    uut = new Electrum()
  })

  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes
  })

  describe('#transactionsBulk', () => {
    it('should return only last 100 tx in history', async () => {
      const testAddr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
      req.body.addresses = [testAddr]

      const result = await uut.transactionsBulk(req, res)
      // console.log('result: ', JSON.stringify(result, null, 2))

      // Assert that the returned address is the one expected.
      assert.equal(result.transactions[0].address, testAddr)

      // Assert that the number of transaction are only 100, and not the
      // complete transaction history.
      assert.equal(result.transactions[0].transactions.length, 100)

      // Assert that the first element is larger than the last element
      const firstElem = result.transactions[0].transactions[0]
      const lastElem = result.transactions[0].transactions.slice(-1)
      assert.isAbove(firstElem.height, lastElem[0].height)
    })

    it('should return the entire tx history', async () => {
      const testAddr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
      req.body.addresses = [testAddr]
      req.body.allTxs = true

      const result = await uut.transactionsBulk(req, res)
      // console.log('result: ', JSON.stringify(result, null, 2))

      // Assert that the returned address is the one expected.
      assert.equal(result.transactions[0].address, testAddr)

      // Assert that the number of transaction are only 100, and not the
      // complete transaction history.
      assert.isAbove(result.transactions[0].transactions.length, 100)

      // Assert that the first element is larger than the last element
      const firstElem = result.transactions[0].transactions[0]
      const lastElem = result.transactions[0].transactions.slice(-1)
      assert.isAbove(firstElem.height, lastElem[0].height)
    })
  })

  describe('#getTransactions', () => {
    it('should return only last 100 tx in history', async () => {
      const testAddr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
      req.params.address = testAddr
      req.params.allTxs = false

      const result = await uut.getTransactions(req, res)
      // console.log('result: ', JSON.stringify(result, null, 2))

      // Assert that the number of transaction are only 100, and not the
      // complete transaction history.
      assert.equal(result.transactions.length, 100)

      // Assert that the first element is larger than the last element
      const firstElem = result.transactions[0]
      const lastElem = result.transactions.slice(-1)
      assert.isAbove(firstElem.height, lastElem[0].height)
    })

    it('should return the entire tx history', async () => {
      const testAddr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
      req.params.address = testAddr
      req.params.allTxs = true

      const result = await uut.getTransactions(req, res)
      // console.log('result: ', JSON.stringify(result, null, 2))

      // Assert that the number of transaction are only 100, and not the
      // complete transaction history.
      assert.isAbove(result.transactions.length, 100)

      // Assert that the first element is larger than the last element
      const firstElem = result.transactions[0]
      const lastElem = result.transactions.slice(-1)
      assert.isAbove(firstElem.height, lastElem[0].height)
    })
  })
})
