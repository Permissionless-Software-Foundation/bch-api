/*
  This library contains mocking data for running unit tests on the psf-slp-indexer route.
*/

'use strict'

const tokenStats = {
  tokenData: {
    type: 1,
    ticker: 'TP03',
    name: 'Test Plugin 03',
    tokenId: '13cad617d523c8eb4ab11fff19c010e0e0a4ea4360b58e0c8c955a45a146a669',
    documentUri: 'fullstack.cash',
    documentHash: 'i\u0004���3��s\u0003�tz}�/��P�ǚ�Z>T��)��',
    decimals: 0,
    mintBatonIsActive: false,
    tokensInCirculationBN: '1',
    tokensInCirculationStr: '1',
    blockCreated: 722420,
    totalBurned: '0',
    totalMinted: '1',
    txs: [
      {
        txid: '13cad617d523c8eb4ab11fff19c010e0e0a4ea4360b58e0c8c955a45a146a669',
        height: 722420,
        type: 'GENESIS',
        qty: '1'
      }
    ]
  }
}

module.exports = {
  tokenStats
}
