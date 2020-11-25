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

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

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
      req.params.tokenId = '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'
      // 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const result = await slp.tokenStats(req, res)
      // console.log(`result: ${util.inspect(result)}`)

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
      req.params.tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const result = await slp.tokenStats(req, res)
      // console.log(`result: ${util.inspect(result)}`)

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

  describe('#generateSendOpReturn', () => {
    it('should return OP_RETURN script', async () => {
      req.body.tokenUtxos = [
        {
          tokenId: '0a321bff9761f28e06a268b14711274bb77617410a16807bd0437ef234a072b1',
          decimals: 0,
          tokenQty: 2,
        },
      ]
      req.body.sendQty = 1.5

      const result = await slp.generateSendOpReturn(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ['script', 'outputs'])
      assert.isNumber(result.outputs)
    })
  })

  describe('#hydrateUtxos', () => {
    it('should return utxo details', async () => {
      const utxos = [
        {
          utxos: [
            {
              txid: 'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56',
              vout: 3,
              value: '6816',
              height: 606848,
              confirmations: 13,
              satoshis: 6816,
            },
            {
              txid: 'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56',
              vout: 2,
              value: '546',
              height: 606848,
              confirmations: 13,
              satoshis: 546,
            },
          ],
        },
      ]

      req.body.utxos = utxos
      const result = await slp.hydrateUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // Test the general structure of the output.
      assert.isArray(result.slpUtxos)
      assert.equal(result.slpUtxos.length, 1)
      assert.equal(result.slpUtxos[0].utxos.length, 2)

      // Test the non-slp UTXO.
      assert.property(result.slpUtxos[0].utxos[0], 'txid')
      assert.property(result.slpUtxos[0].utxos[0], 'vout')
      assert.property(result.slpUtxos[0].utxos[0], 'value')
      assert.property(result.slpUtxos[0].utxos[0], 'height')
      assert.property(result.slpUtxos[0].utxos[0], 'confirmations')
      assert.property(result.slpUtxos[0].utxos[0], 'satoshis')
      assert.property(result.slpUtxos[0].utxos[0], 'isValid')
      assert.equal(result.slpUtxos[0].utxos[0].isValid, false)

      // Test the slp UTXO.
      assert.property(result.slpUtxos[0].utxos[1], 'txid')
      assert.property(result.slpUtxos[0].utxos[1], 'vout')
      assert.property(result.slpUtxos[0].utxos[1], 'value')
      assert.property(result.slpUtxos[0].utxos[1], 'height')
      assert.property(result.slpUtxos[0].utxos[1], 'confirmations')
      assert.property(result.slpUtxos[0].utxos[1], 'satoshis')
      assert.property(result.slpUtxos[0].utxos[1], 'isValid')
      assert.equal(result.slpUtxos[0].utxos[1].isValid, true)
      assert.property(result.slpUtxos[0].utxos[1], 'transactionType')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenId')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenTicker')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenName')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenDocumentUrl')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenDocumentHash')
      assert.property(result.slpUtxos[0].utxos[1], 'decimals')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenType')
      assert.property(result.slpUtxos[0].utxos[1], 'tokenQty')
    })

    it('should process data directly from Electrumx', async () => {
      const addrs = [
        'bitcoincash:qq6mvsm7l92d77zpymmltvaw09p5uzghyuyx7spygg',
        'bitcoincash:qpjdrs8qruzh8xvusdfmutjx62awcepnhyperm3g89',
        'bitcoincash:qzygn28zpgeemnptkn26xzyuzzfu9l8f9vfvq7kptk',
      ]

      const utxos = await bchjs.Electrumx.utxo(addrs)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      req.body.utxos = utxos.utxos
      const result = await slp.hydrateUtxos(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // Test the general structure of the output.
      assert.isArray(result.slpUtxos)
      assert.equal(result.slpUtxos.length, 3)
      assert.equal(result.slpUtxos[0].utxos.length, 1)
      assert.equal(result.slpUtxos[1].utxos.length, 1)
      assert.equal(result.slpUtxos[2].utxos.length, 2)
    })
  })

  describe('#validate2Single', () => {
    it('should invalidate a known invalid TXID', async () => {
      const txid = 'f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a'

      req.params.txid = txid
      const result = await slp.validate2Single(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.txid, txid)
      assert.equal(result.isValid, false)
    })

    it('should validate a known valid TXID', async () => {
      const txid = '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488'

      req.params.txid = txid
      const result = await slp.validate2Single(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.txid, txid)
      assert.equal(result.isValid, true)
    })

    // CT 10-11-2020: This test is valid, but because of the cacheing built
    // into slp-validate, it will not consistently pass or fail. To manually
    // Run this test, re-start slp-api or find a token txid with a long DAG.
    // it('should cancel if validation takes too long', async () => {
    //   const txid =
    //     'eacb1085dfa296fef6d4ae2c0f4529a1bef096dd2325bdcc6dcb5241b3bdb579'
    //
    //   req.params.txid = txid
    //   const result = await slp.validate2Single(req, res)
    //   // console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.isAbove(res.statusCode, 499, 'HTTP status code 503 expected.')
    //   assert.include(
    //     result.error,
    //     'Could not communicate with full node',
    //     'Error message expected'
    //   )
    // })
  })
})
