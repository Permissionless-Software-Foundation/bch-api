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
  throw new Error(
    'SLPDB_URL and SLPDB_PASS must be defined in order to run these tests.'
  )
}

const SLP = require('../../../src/routes/v4/slp')
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
      req.params.tokenId =
        '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7'
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
      req.params.tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

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
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          decimals: 8,
          tokenQty: 2
        }
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
              txid:
                'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56',
              vout: 3,
              value: '6816',
              height: 606848,
              confirmations: 13,
              satoshis: 6816
            },
            {
              txid:
                'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56',
              vout: 2,
              value: '546',
              height: 606848,
              confirmations: 13,
              satoshis: 546
            }
          ]
        }
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
        'bitcoincash:qzygn28zpgeemnptkn26xzyuzzfu9l8f9vfvq7kptk'
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

  describe('#hydrateUtxosWL', () => {
    it('should return utxo details', async () => {
      const utxos = [
        {
          utxos: [
            {
              tx_hash:
                '89b3f0c84efe8b01b24e2d7ac08636de5781f31dbb84478e3de868ca0a7ed93a',
              tx_pos: 1,
              value: 546
            }
          ]
        }
      ]

      req.body.utxos = utxos
      const result = await slp.hydrateUtxosWL(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // Test the general structure of the output.
      assert.isArray(result.slpUtxos)
      assert.equal(result.slpUtxos.length, 1)
      assert.equal(result.slpUtxos[0].utxos.length, 1)

      // Test the non-slp UTXO.
      assert.property(result.slpUtxos[0].utxos[0], 'tx_hash')
      assert.property(result.slpUtxos[0].utxos[0], 'tx_pos')
      assert.property(result.slpUtxos[0].utxos[0], 'value')
      assert.property(result.slpUtxos[0].utxos[0], 'isValid')
      assert.equal(result.slpUtxos[0].utxos[0].isValid, true)
    })
  })

  describe('#validate2Single', () => {
    it('should invalidate a known invalid TXID', async () => {
      const txid =
        'f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a'

      req.params.txid = txid
      const result = await slp.validate2Single(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.txid, txid)
      assert.equal(result.isValid, false)
    })

    it('should validate a known valid TXID', async () => {
      const txid =
        '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488'

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

  describe('#validateBulk', () => {
    it('should handle a mix of valid, invalid, and non-SLP txs', async () => {
      const txids = [
        // Malformed SLP tx
        'f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a',
        // Normal TX (non-SLP)
        '01cdaec2f8b311fc2d6ecc930247bd45fa696dc204ab684596e281fe1b06c1f0',
        // Valid PSF SLP tx
        'daf4d8b8045e7a90b7af81bfe2370178f687da0e545511bce1c9ae539eba5ffd',
        // Valid SLP token not in whitelist
        '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488',
        // Token send on BCHN network.
        '402c663379d9699b6e2dd38737061e5888c5a49fca77c97ab98e79e08959e019',
        // Token send on ABC network.
        '336bfe2168aac4c3303508a9e8548a0d33797a83b85b76a12d845c8d6674f79d',
        // Known invalid SLP token send of PSF tokens.
        '2bf691ad3679d928fef880b8a45b93b233f8fa0d0a92cf792313dbe77b1deb74'
      ]

      req.body.txids = txids
      const result = await slp.validateBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // BCHN expected results
      if (process.env.ISBCHN) {
        assert.equal(result[0].txid, txids[0])
        assert.equal(result[0].valid, null)

        assert.equal(result[1].txid, txids[1])
        assert.equal(result[1].valid, null)

        assert.equal(result[2].txid, txids[2])
        assert.equal(result[2].valid, true)

        assert.equal(result[3].txid, txids[3])
        assert.equal(result[3].valid, true)

        // Note: This should change from null to true once SLPDB finishes indexing.
        assert.equal(result[4].txid, txids[4])
        assert.equal(result[4].valid, null)

        assert.equal(result[5].txid, txids[5])
        assert.equal(result[5].valid, null)

        assert.equal(result[6].txid, txids[6])
        assert.equal(result[6].valid, false)
        assert.include(
          result[6].invalidReason,
          'Token outputs are greater than valid token inputs'
        )
      } else {
        assert.equal(result[0].txid, txids[0])
        assert.equal(result[0].valid, null)

        assert.equal(result[1].txid, txids[1])
        assert.equal(result[1].valid, null)

        assert.equal(result[2].txid, txids[2])
        assert.equal(result[2].valid, true)

        assert.equal(result[3].txid, txids[3])
        assert.equal(result[3].valid, true)

        assert.equal(result[4].txid, txids[4])
        assert.equal(result[4].valid, null)

        assert.equal(result[5].txid, txids[5])
        assert.equal(result[5].valid, true)

        assert.equal(result[6].txid, txids[6])
        assert.equal(result[6].valid, false)
        assert.include(
          result[6].invalidReason,
          'Token outputs are greater than valid token inputs'
        )
      }
    })
  })

  describe('#validate3Bulk', () => {
    it('should handle a mix of valid, invalid, and non-SLP txs', async () => {
      const txids = [
        // Malformed SLP tx
        'f7e5199ef6669ad4d078093b3ad56e355b6ab84567e59ad0f08a5ad0244f783a',
        // Normal TX (non-SLP)
        '01cdaec2f8b311fc2d6ecc930247bd45fa696dc204ab684596e281fe1b06c1f0',
        // Valid PSF SLP tx
        'daf4d8b8045e7a90b7af81bfe2370178f687da0e545511bce1c9ae539eba5ffd',
        // Valid SLP token not in whitelist
        '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488',
        // Token send on BCHN network.
        '402c663379d9699b6e2dd38737061e5888c5a49fca77c97ab98e79e08959e019',
        // Token send on ABC network.
        '336bfe2168aac4c3303508a9e8548a0d33797a83b85b76a12d845c8d6674f79d',
        // Known invalid SLP token send of PSF tokens.
        '2bf691ad3679d928fef880b8a45b93b233f8fa0d0a92cf792313dbe77b1deb74'
      ]

      req.body.txids = txids
      const result = await slp.validate3Bulk(req, res)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // BCHN expected results
      if (process.env.ISBCHN) {
        assert.equal(result[0].txid, txids[0])
        assert.equal(result[0].valid, null)

        assert.equal(result[1].txid, txids[1])
        assert.equal(result[1].valid, null)

        assert.equal(result[2].txid, txids[2])
        assert.equal(result[2].valid, true)

        assert.equal(result[3].txid, txids[3])
        assert.equal(result[3].valid, null)

        // Note: This should change from null to true once SLPDB finishes indexing.
        assert.equal(result[4].txid, txids[4])
        assert.equal(result[4].valid, null)

        assert.equal(result[5].txid, txids[5])
        assert.equal(result[5].valid, null)

        assert.equal(result[6].txid, txids[6])
        assert.equal(result[6].valid, false)
        assert.include(
          result[6].invalidReason,
          'Token outputs are greater than valid token inputs'
        )
      } else {
        assert.equal(result[0].txid, txids[0])
        assert.equal(result[0].valid, null)

        assert.equal(result[1].txid, txids[1])
        assert.equal(result[1].valid, null)

        assert.equal(result[2].txid, txids[2])
        assert.equal(result[2].valid, true)

        assert.equal(result[3].txid, txids[3])
        assert.equal(result[3].valid, true)

        assert.equal(result[4].txid, txids[4])
        assert.equal(result[4].valid, null)

        assert.equal(result[5].txid, txids[5])
        assert.equal(result[5].valid, true)

        assert.equal(result[6].txid, txids[6])
        assert.equal(result[6].valid, false)
        assert.include(
          result[6].invalidReason,
          'Token outputs are greater than valid token inputs'
        )
      }
    })
  })

  describe('#getStatus', () => {
    it('should get the SLPDB status', async () => {
      const result = await slp.getStatus(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'bchBlockHeight')
    })
  })
})
