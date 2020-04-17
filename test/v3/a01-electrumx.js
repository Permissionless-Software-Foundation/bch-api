/*
  TESTS FOR THE ELECTRUMX.JS LIBRARY

  Named with a01 prefix so that these tests are run first. Something about running
  the Blcokbook and Blockchain tests screws up these tests. Spend a couple hours
  debugging and couldn't isolate the source of the issue, but renaming the file
  was an easy fix.

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

'use strict'

const chai = require('chai')
const assert = chai.assert

const sinon = require('sinon')

const ElecrumxRoute = require('../../src/routes/v3/electrumx')

// Mocking data.
const { mockReq, mockRes } = require('./mocks/express-mocks')
const mockData = require('./mocks/electrumx-mock')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

describe('#ElectrumX Router', () => {
  let req, res
  let sandbox
  const electrumxRoute = new ElecrumxRoute()

  before(async () => {
    if (!process.env.TEST) process.env.TEST = 'unit'
    console.log(`Testing type is: ${process.env.TEST}`)

    if (!process.env.NETWORK) process.env.NETWORK = 'testnet'

    // Connect to electrumx servers if this is an integration test.
    if (process.env.TEST === 'integration') {
      await electrumxRoute.connect()
      console.log('Connected to ElectrumX server')
    }
  })

  after(async () => {
    // console.log(`electrumxRoute.electrumx: `, electrumxRoute.electrumx)

    // Disconnect from the electrumx server if this is an integration test.
    if (process.env.TEST === 'integration') {
      await electrumxRoute.disconnect()
      console.log('Disconnected from ElectrumX server')
    }
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

    // electrumxRoute = new ElecrumxRoute()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    //
  })

  describe('#root', () => {
    // root route handler.
    const root = electrumxRoute.root

    it('should respond to GET for base route', async () => {
      const result = root(req, res)

      assert.equal(result.status, 'electrumx', 'Returns static string')
    })
  })

  describe('#addressToScripthash', () => {
    it('should accurately return a scripthash', () => {
      const addr = 'bitcoincash:qpr270a5sxphltdmggtj07v4nskn9gmg9yx4m5h7s4'

      const scripthash = electrumxRoute.addressToScripthash(addr)

      const expectedOutput =
        'bce4d5f2803bd1ed7c1ba00dcb3edffcbba50524af7c879d6bb918d04f138965'

      assert.equal(scripthash, expectedOutput)
    })
  })

  describe('#_utxosFromElectrumx', () => {
    it('should throw error for invalid address', async () => {
      try {
        // Address has invalid checksum.
        const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

        // Call the details API.
        await electrumxRoute._utxosFromElectrumx(address)

        assert.equal(true, false, 'Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Invalid checksum')
      }
    })

    it('should return empty array for address with no utxos', async () => {
      // Address has invalid checksum.
      const address = 'bchtest:qqtmlpspjakqlvywae226esrcdrj9auynuwadh55uf'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox.stub(electrumxRoute.electrumx, 'request').resolves([])
      }

      // Call the details API.
      const result = await electrumxRoute._utxosFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 0)
    })

    it('should get balance for a single address', async () => {
      const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves(mockData.utxos)
      }

      // Call the details API.
      const result = await electrumxRoute._utxosFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.property(result[0], 'height')
      assert.property(result[0], 'tx_hash')
      assert.property(result[0], 'tx_pos')
      assert.property(result[0], 'value')
    })
  })

  describe('#getUtxos', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from ElectrumX to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves(mockData.utxos)
      }

      // Call the details API.
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get balance for a single address', async () => {
      req.params.address =
        'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_utxosFromElectrumx')
          .resolves(mockData.utxos)
      }

      // Call the details API.
      const result = await electrumxRoute.getUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.isArray(result.utxos)

      assert.property(result.utxos[0], 'height')
      assert.property(result.utxos[0], 'tx_hash')
      assert.property(result.utxos[0], 'tx_pos')
      assert.property(result.utxos[0], 'value')
    })
  })

  describe('#utxosBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
      }

      const result = await electrumxRoute.utxosBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
      }

      const result = await electrumxRoute.utxosBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should detect a network mismatch', async () => {
      req.body = {
        addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
      }

      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should get details for a single address', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_utxosFromElectrumx')
          .resolves(mockData.utxos)
      }

      // Call the details API.
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'utxos')
      assert.isArray(result.utxos)

      assert.property(result.utxos[0], 'address')
      assert.property(result.utxos[0], 'utxos')

      assert.isArray(result.utxos[0].utxos)
      assert.property(result.utxos[0].utxos[0], 'height')
      assert.property(result.utxos[0].utxos[0], 'tx_hash')
      assert.property(result.utxos[0].utxos[0], 'tx_pos')
      assert.property(result.utxos[0].utxos[0], 'value')
    })

    it('should get utxos for multiple addresses', async () => {
      req.body = {
        addresses: [
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_utxosFromElectrumx')
          .resolves(mockData.utxos)
      }

      // Call the details API.
      const result = await electrumxRoute.utxosBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.isArray(result.utxos)
      assert.isArray(result.utxos[0].utxos)
      assert.equal(result.utxos.length, 2, '2 outputs for 2 inputs')
    })
  })

  describe('#_balanceFromElectrumx', () => {
    it('should throw error for invalid address', async () => {
      try {
        // Address has invalid checksum.
        const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

        // Mock unit tests to prevent live network calls.
        // if (process.env.TEST === 'unit') {
        //   electrumxRoute.isReady = true // Force flag.
        //
        //   sandbox
        //     .stub(electrumxRoute.electrumx, 'request')
        //     .throws('Invalid Argument: Invalid checksum:')
        // }

        // Call the details API.
        await electrumxRoute._balanceFromElectrumx(address)

        assert.equal(true, false, 'Unexpected code path')
      } catch (err) {
        // console.log('err2: ', err)
        assert.include(err.message, 'Invalid checksum')
      }
    })

    it('should get balance for a single address', async () => {
      const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves(mockData.balance)
      }

      // Call the details API.
      const result = await electrumxRoute._balanceFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'confirmed')
      assert.property(result, 'unconfirmed')
    })

    it('should get balance for an address with no transaction history', async () => {
      const address = 'bitcoincash:qp2ew6pvrs22jtsvtjyumjgas6jkvgn2hy3ad4wpw8'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves(mockData.balance)
      }

      // Call the details API.
      const result = await electrumxRoute._balanceFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'confirmed')
      assert.property(result, 'unconfirmed')
    })
  })

  describe('#getBalance', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from electrum-cash to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get balance for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_balanceFromElectrumx')
          .resolves(mockData.balance)
      }

      // Call the details API.
      const result = await electrumxRoute.getBalance(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'balance')
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })
  })

  describe('#balanceBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
      }

      const result = await electrumxRoute.balanceBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
      }

      const result = await electrumxRoute.balanceBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should detect a network mismatch', async () => {
      req.body = {
        addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
      }

      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should get details for a single address', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_balanceFromElectrumx')
          .resolves(mockData.balance)
      }

      // Call the details API.
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'balances')
      assert.isArray(result.balances)

      assert.property(result.balances[0], 'address')
      assert.property(result.balances[0], 'balance')

      assert.property(result.balances[0].balance, 'confirmed')
      assert.property(result.balances[0].balance, 'unconfirmed')
    })

    it('should get utxos for multiple addresses', async () => {
      req.body = {
        addresses: [
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_balanceFromElectrumx')
          .resolves(mockData.balance)
      }

      // Call the details API.
      const result = await electrumxRoute.balanceBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.isArray(result.balances)
      assert.equal(result.balances.length, 2, '2 outputs for 2 inputs')
    })
  })

  describe('#_transactionsFromElectrumx', () => {
    it('should throw error for invalid address', async () => {
      try {
        // Address has invalid checksum.
        const address = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

        // Call the details API.
        await electrumxRoute._transactionsFromElectrumx(address)

        assert.equal(true, false, 'Unexpected code path')
      } catch (err) {
        // console.log('err2: ', err)
        assert.include(err.message, 'Invalid checksum')
      }
    })

    it('should get transaction history for a single address', async () => {
      const address = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves(mockData.txHistory)
      }

      // Call the details API.
      const result = await electrumxRoute._transactionsFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.property(result[0], 'height')
      assert.property(result[0], 'tx_hash')
    })

    it('should get history for an address with no transaction history', async () => {
      const address = 'bitcoincash:qp2ew6pvrs22jtsvtjyumjgas6jkvgn2hy3ad4wpw8'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute.electrumx, 'request')
          .resolves([])
      }

      // Call the details API.
      const result = await electrumxRoute._transactionsFromElectrumx(address)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 0)
    })
  })

  describe('#getTransactions', () => {
    it('should throw 400 if address is empty', async () => {
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw 400 on array input', async () => {
      req.params.address = ['qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'address can not be an array')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should throw an error for an invalid address', async () => {
      req.params.address = '02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should detect a network mismatch', async () => {
      req.params.address = 'bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4'

      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'Expect 400 status code')

      assert.property(result, 'error')
      assert.include(result.error, 'Invalid network', 'Proper error message')

      assert.property(result, 'success')
      assert.equal(result.success, false)
    })

    it('should pass errors from ElectrumX to user', async () => {
      // Address has invalid checksum.
      req.params.address =
        'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur2'

      // Call the details API.
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, false)

      assert.property(result, 'error')
      assert.include(result.error, 'Unsupported address format')
    })

    it('should get transactions for a single address', async () => {
      req.params.address =
        'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      // Mock unit tests to prevent live network calls.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_transactionsFromElectrumx')
          .resolves(mockData.txHistory)
      }

      // Call the details API.
      const result = await electrumxRoute.getTransactions(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'transactions')
      assert.isArray(result.transactions)
      assert.property(result.transactions[0], 'height')
      assert.property(result.transactions[0], 'tx_hash')
    })
  })

  describe('#balanceBulk', () => {
    it('should throw an error for an empty body', async () => {
      req.body = {}

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should error on non-array single address', async () => {
      req.body = {
        address: 'qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
      }

      const result = await electrumxRoute.transactionsBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'addresses needs to be an array',
        'Proper error message'
      )
    })

    it('should throw an error for an invalid address', async () => {
      req.body = {
        addresses: ['02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c']
      }

      const result = await electrumxRoute.transactionsBulk(req, res)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(
        result.error,
        'Invalid BCH address',
        'Proper error message'
      )
    })

    it('should throw 400 error if addresses array is too large', async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push('')

      req.body.addresses = testArray

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['error'])
      assert.include(result.error, 'Array too large')
    })

    it('should detect a network mismatch', async () => {
      req.body = {
        addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
      }

      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, 'HTTP status code 400 expected.')
      assert.include(result.error, 'Invalid network', 'Proper error message')
    })

    it('should get details for a single address', async () => {
      req.body = {
        addresses: ['bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7']
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_transactionsFromElectrumx')
          .resolves(mockData.txHistory)
      }

      // Call the details API.
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.property(result, 'transactions')
      assert.isArray(result.transactions)

      assert.property(result.transactions[0], 'address')
      assert.property(result.transactions[0], 'transactions')

      assert.isArray(result.transactions[0].transactions)
      assert.property(result.transactions[0].transactions[0], 'height')
      assert.property(result.transactions[0].transactions[0], 'tx_hash')
    })

    it('should get utxos for multiple addresses', async () => {
      req.body = {
        addresses: [
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
          'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === 'unit') {
        electrumxRoute.isReady = true // Force flag.

        sandbox
          .stub(electrumxRoute, '_transactionsFromElectrumx')
          .resolves(mockData.txHistory)
      }

      // Call the details API.
      const result = await electrumxRoute.transactionsBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.equal(result.success, true)

      assert.isArray(result.transactions)
      assert.equal(result.transactions.length, 2, '2 outputs for 2 inputs')
    })
  })
})
