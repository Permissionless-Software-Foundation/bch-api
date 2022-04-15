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

const txData = {
  txData: {
    txid: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    hash: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    version: 2,
    size: 339,
    locktime: 0,
    vin: [
      {
        txid: '8370db30d94761ab9a11b71ecd22541151bf6125c8c613f0f6fab8ab794565a7',
        vout: 0,
        scriptSig: {
          asm: '304402207e9631c53dfc8a9a793d1916469628c6b7c5780c01c2f676d51ef21b0ba4926f022069feb471ec869a49f8d108d0aaba04e7cd36e60a7500109d86537f55698930d4[ALL|FORKID] 02791b19a39165dbd83403d6df268d44fd621da30581b0b6e5cb15a7101ed58851',
          hex: '47304402207e9631c53dfc8a9a793d1916469628c6b7c5780c01c2f676d51ef21b0ba4926f022069feb471ec869a49f8d108d0aaba04e7cd36e60a7500109d86537f55698930d4412102791b19a39165dbd83403d6df268d44fd621da30581b0b6e5cb15a7101ed58851'
        },
        sequence: 4294967295,
        address: 'bitcoincash:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qwgaqm3wq',
        value: 0.00051303,
        tokenQty: 0,
        tokenQtyStr: '0',
        tokenId: null
      }
    ],
    vout: [
      {
        value: 0,
        n: 0,
        scriptPubKey: {
          asm: 'OP_RETURN 5262419 1 47454e45534953 54524f5554 54726f75742773207465737420746f6b656e 74726f757473626c6f672e636f6d 0 2 2 000000174876e800',
          hex: '6a04534c500001010747454e455349530554524f55541254726f75742773207465737420746f6b656e0e74726f757473626c6f672e636f6d4c000102010208000000174876e800',
          type: 'nulldata'
        },
        tokenQtyStr: '0',
        tokenQty: 0
      }
    ],
    hex: '0200000001a7654579abb8faf6f013c6c82561bf51115422cd1eb7119aab6147d930db7083000000006a47304402207e9631c53dfc8a9a793d1916469628c6b7c5780c01c2f676d51ef21b0ba4926f022069feb471ec869a49f8d108d0aaba04e7cd36e60a7500109d86537f55698930d4412102791b19a39165dbd83403d6df268d44fd621da30581b0b6e5cb15a7101ed58851ffffffff040000000000000000476a04534c500001010747454e455349530554524f55541254726f75742773207465737420746f6b656e0e74726f757473626c6f672e636f6d4c000102010208000000174876e80022020000000000001976a914db4d39ceb7794ffe5d06855f249e1d3a7f1b024088ac22020000000000001976a914db4d39ceb7794ffe5d06855f249e1d3a7f1b024088accec20000000000001976a9145904159f2f69bfa63eefa712633a0d96dc2e7e8888ac00000000',
    blockhash: '0000000000000000009f65225a3e12e23a7ea057c869047e0f36563a1f410267',
    confirmations: 97398,
    time: 1581773131,
    blocktime: 1581773131,
    blockheight: 622414,
    isSlpTx: true,
    tokenTxType: 'GENESIS',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenType: 1,
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDecimals: 2,
    tokenUri: 'troutsblog.com',
    tokenDocHash: '',
    isValidSlp: true
  }
}
const balance = {
  balance: {
    utxos: [
      {
        txid: 'a24a6a4abf06fabd799ecea4f8fac6a9ff21e6a8dd6169a3c2ebc03665329db9',
        vout: 1,
        type: 'token',
        qty: '1800',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        address: 'bitcoincash:qrqy3kj7r822ps6628vwqq5k8hyjl6ey3y4eea2m4s'
      }
    ],
    txs: [
      {
        txid: '078b2c48ed1db0d5d5996f2889b8d847a49200d0a781f6aa6752f740f312688f',
        height: 717796
      },
      {
        txid: 'a24a6a4abf06fabd799ecea4f8fac6a9ff21e6a8dd6169a3c2ebc03665329db9',
        height: 717832
      }
    ],
    balances: [
      {
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        qty: '1800'
      }
    ]
  }
}
const transactions = {
  success: true,
  transactions: [
    {
      height: 734439,
      tx_hash: '0bd2a8a72108659cd39a59bde89c45fff7d51c334531f036b1e102ab4b62f33f'
    },
    {
      height: 734441,
      tx_hash: '4f2837b7fff325c0442b550863de3470e016df234561d9151cbb6949fe43ac17'
    },
    {
      height: 735564,
      tx_hash: '1bfa83355839c0ef0f974463415fa983466e0286d7bcdfdd825f244e357ad1e5'
    },
    {
      height: 735564,
      tx_hash: '6eba09627175af4b50ac75fa8b3a15a9015df8a19b5b28a992f26044f4fd8891'
    },
    {
      height: 735564,
      tx_hash: 'c37ba29f40ecc61662ea56324fdb72a5f1e66add2078854c2144765b9030358a'
    }]
}

const status = {
  status: {
    startBlockHeight: 543376,
    syncedBlockHeight: 722860,
    chainBlockHeight: 722679
  }
}
const immutableData = {
  payloadCid: 'QmY3EaRaUcc5bNuqDfc7TaeNPThBGUefbqJeJVDjCqxqFZ',
  about: 'This is a placeholder'
}
const mutableData = {
  tokenIcon: 'https://gateway.ipfs.io/ipfs/bafybeiehitanirn5gmhqjg44xrmdtomn4n5lu5yjoepsvgpswk5mggaw6i/LP_logo-1.png',
  about: 'Mutable data managed with npm package: https://www.npmjs.com/package/slp-mutable-data'
}

const decodedOpReturn = JSON.stringify({
  mspAdddress: 'bitcoincash:qrg77j4jf2pl7azgvzrz2z567ls464gkuuhplt30dp',
  cid: 'bafybeie6t5uyupddc7azms737xg4hxrj7i5t5ov3lb5g2qeehaujj6ak64'
})
module.exports = {
  tokenStats,
  txData,
  balance,
  status,
  transactions,
  immutableData,
  mutableData,
  decodedOpReturn
}
