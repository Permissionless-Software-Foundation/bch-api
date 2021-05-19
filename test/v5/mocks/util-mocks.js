/*
  This library contains mocking data for running unit tests on the address route.
*/

'use strict'

const mockAddress = {
  isvalid: true,
  address: 'bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y',
  scriptPubKey: '76a914016a935f87e8deeab04501889b22d87e4e52db0988ac',
  ismine: false,
  iswatchonly: false,
  isscript: false
}

// const mockBalance = {
//   page: 1,
//   totalPages: 1,
//   itemsOnPage: 1000,
//   address: 'bitcoincash:qzp7gdl52edm24xlpkyqnza9rv43u3mdxyc77j3u6k',
//   balance: '2546',
//   totalReceived: '2546',
//   totalSent: '0',
//   unconfirmedBalance: '0',
//   unconfirmedTxs: 0,
//   txs: 2,
//   txids: [
//     'e190d13b88578132608ab912a4d2be3e55aa2792d6042d481ae21d700639de56',
//     '44e1f48c4093fc61db1a8fa206aa402fc34e482b3f788cb38c123ca0e1a35db6'
//   ]
// }

const mockBalance = {
  confirmed: 2546,
  unconfirmed: 0
}

const mockUtxos = [
  {
    tx_hash: 'e190d13b88578132608ab912a4d2be3e55aa2792d6042d481ae21d700639de56',
    tx_pos: 0,
    value: 2000,
    height: 605873
  },
  {
    tx_hash: '44e1f48c4093fc61db1a8fa206aa402fc34e482b3f788cb38c123ca0e1a35db6',
    tx_pos: 1,
    value: 546,
    height: 605873
  }
]

const mockThreeUtxos = [
  {
    tx_hash: 'e190d13b88578132608ab912a4d2be3e55aa2792d6042d481ae21d700639de56',
    tx_pos: 0,
    value: 2000,
    height: 605873
  },
  {
    tx_hash: '44e1f48c4093fc61db1a8fa206aa402fc34e482b3f788cb38c123ca0e1a35db6',
    tx_pos: 1,
    value: 546,
    height: 605873
  },
  {
    tx_hash: '44e1f48c4093fc61db1a8fa206aa402fc34e482b3f788cb38c123ca0e1a35db6',
    tx_pos: 1,
    value: 546,
    height: 605873
  }
]

const mockIsTokenUtxos = [
  false,
  {
    tx_hash: '44e1f48c4093fc61db1a8fa206aa402fc34e482b3f788cb38c123ca0e1a35db6',
    tx_out: 1,
    value: 546,
    height: 605873,
    confirmations: 298,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    tokenTicker: 'TOK-CH',
    tokenName: 'TokyoCash',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenQty: 2
  }
]

const tapUtxo = {
  txid: '2e030df12390186baf817fa2760540b886511e04bc520e88f6b4c2124cc2a7d4',
  vout: 1,
  value: '546',
  height: 606564,
  confirmations: 3,
  satoshis: 546,
  utxoType: 'token',
  transactionType: 'send',
  tokenId: 'dd84ca78db4d617221b58eabc6667af8fe2f7eadbfcc213d35be9f1b419beb8d',
  tokenTicker: 'TAP',
  tokenName: 'Thoughts and Prayers',
  tokenDocumentUrl: '',
  tokenDocumentHash: '',
  decimals: 0,
  tokenQty: 1
}

const tokensOnly = [mockIsTokenUtxos[1], tapUtxo]

const multipleTokens = [false, mockIsTokenUtxos[1], tapUtxo]

module.exports = {
  mockAddress,
  mockBalance,
  mockUtxos,
  mockThreeUtxos,
  mockIsTokenUtxos,
  tokensOnly,
  multipleTokens
}
