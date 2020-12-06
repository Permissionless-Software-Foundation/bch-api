/*
  This library contains mocking data for running unit tests.
*/

'use strict'

const mockList = {
  t: [
    {
      tokenDetails: {
        tokenIdHex:
          'df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb',
        documentUri: '',
        documentSha256: '',
        symbol: 'NAKAMOTO',
        name: 'NAKAMOTO',
        decimals: 8
      },
      tokenStats: {
        qty_valid_txns_since_genesis: 241,
        qty_valid_token_utxos: 151,
        qty_valid_token_addresses: 113,
        qty_token_circulating_supply: '20995990',
        qty_token_burned: '4010',
        qty_token_minted: '21000000',
        qty_satoshis_locked_up: 81900
      }
    }
  ]
}

const mockSingleToken = {
  t: [
    {
      tokenDetails: {
        decimals: 0,
        tokenIdHex:
          '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
        timestamp: '2019-06-14 06:31:37',
        timestamp_unix: 1560493897,
        transactionType: 'GENESIS',
        versionType: 1,
        documentUri: 'ot@ot.com',
        documentSha256Hex: null,
        symbol: 'OT',
        name: 'Test First SLP oasis Token',
        batonVout: 2,
        containsBaton: true,
        genesisOrMintQuantity: '10000',
        sendOutputs: null
      },
      tokenStats: {
        block_created: 1308634,
        block_last_active_send: 1308655,
        block_last_active_mint: 1308636,
        qty_valid_txns_since_genesis: 11,
        qty_valid_token_utxos: 9,
        qty_valid_token_addresses: 2,
        qty_token_minted: '20000',
        qty_token_burned: '0',
        qty_token_circulating_supply: '20000',
        qty_satoshis_locked_up: 4914,
        minting_baton_status: 'ALIVE'
      }
    }
  ]
}

const mockSingleTokenError = {
  t: []
}

const mockSingleAddress = {
  g: [
    {
      _id: 'f05faf13a29c7f5e54ab921750aafb6afaa953db863bd2cf432e918661d4132f',
      balanceString: '0.002382',
      slpAddress: 'simpleledger:qpujxqra3jmdlzzapwmmt7uspr7q0c9ff5me5fdrdn'
    }
  ],
  t: [
    {
      tokenDetails: {
        decimals: 6,
        tokenIdHex:
          'f05faf13a29c7f5e54ab921750aafb6afaa953db863bd2cf432e918661d4132f'
      }
    }
  ]
}

const mockTx = {
  txid: '57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457822d446',
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: '61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49',
      vout: 2,
      sequence: 4294967295,
      n: 0,
      scriptSig: {
        hex:
          '4730440220409e79fec552f01203f41d3d621ae3db89c720af261c8268ce5f0453de009f5d022001e7ffefeba7b0716d32ea55cb6ace267b6ee9cbcc8a017bb9c3b6acf7889418412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585',
        asm:
          '30440220409e79fec552f01203f41d3d621ae3db89c720af261c8268ce5f0453de009f5d022001e7ffefeba7b0716d32ea55cb6ace267b6ee9cbcc8a017bb9c3b6acf7889418[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585'
      },
      value: 546,
      legacyAddress: 'mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL',
      cashAddress: 'bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09'
    },
    {
      txid: '61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49',
      vout: 1,
      sequence: 4294967295,
      n: 1,
      scriptSig: {
        hex:
          '483045022100a743bee56c99bd103be48a78fa4c7342100815d9d2448dbe6e1d338c3a13b241022066728b5279fc22eef5cd019582ff34771e29175835fc98aa3168a1548fd78ac8412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585',
        asm:
          '3045022100a743bee56c99bd103be48a78fa4c7342100815d9d2448dbe6e1d338c3a13b241022066728b5279fc22eef5cd019582ff34771e29175835fc98aa3168a1548fd78ac8[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585'
      },
      value: 546,
      legacyAddress: 'mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL',
      cashAddress: 'bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09'
    },
    {
      txid: '61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49',
      vout: 3,
      sequence: 4294967295,
      n: 2,
      scriptSig: {
        hex:
          '483045022100821473902eec5f1ce7d43b1ba7f9ec453bfe8b8dfc3de3e0723c883ab109922f02206162960e80618531fab2c16aee260fddd7979bab62471c8686af7de75f8732ec412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585',
        asm:
          '3045022100821473902eec5f1ce7d43b1ba7f9ec453bfe8b8dfc3de3e0723c883ab109922f02206162960e80618531fab2c16aee260fddd7979bab62471c8686af7de75f8732ec[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585'
      },
      value: 9997521,
      legacyAddress: 'mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL',
      cashAddress: 'bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09'
    }
  ],
  vout: [
    {
      value: '0.00000000',
      n: 0,
      scriptPubKey: {
        hex:
          '6a04534c500001010453454e44207ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796080000000049504f80080000001c71e64280',
        asm:
          'OP_RETURN 5262419 1 1145980243 7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796 0000000049504f80 0000001c71e64280'
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: '0.00000546',
      n: 1,
      scriptPubKey: {
        hex: '76a914396b8e57ad0cb58d30e2992f22047b3c20377aa688ac',
        asm:
          'OP_DUP OP_HASH160 396b8e57ad0cb58d30e2992f22047b3c20377aa6 OP_EQUALVERIFY OP_CHECKSIG',
        addresses: ['mkkZf7T3fU3vHSzNPy51HBmM46ghN1gnN9'],
        type: 'pubkeyhash'
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: '0.00000546',
      n: 2,
      scriptPubKey: {
        hex: '76a914aa099b067337dc20993bbfdb5c4f3c6867ba2c5b88ac',
        asm:
          'OP_DUP OP_HASH160 aa099b067337dc20993bbfdb5c4f3c6867ba2c5b OP_EQUALVERIFY OP_CHECKSIG',
        addresses: ['mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL'],
        type: 'pubkeyhash'
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: '0.09996891',
      n: 3,
      scriptPubKey: {
        hex: '76a914aa099b067337dc20993bbfdb5c4f3c6867ba2c5b88ac',
        asm:
          'OP_DUP OP_HASH160 aa099b067337dc20993bbfdb5c4f3c6867ba2c5b OP_EQUALVERIFY OP_CHECKSIG',
        addresses: ['mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL'],
        type: 'pubkeyhash'
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    }
  ],
  blockhash: '000000000000ce978accc64a6bb567acf0c653c202309a0f8e220149bf0c6968',
  blockheight: 1287490,
  confirmations: 746,
  time: 1550855104,
  blocktime: 1550855104,
  valueOut: 0.09997983,
  size: 628,
  valueIn: 0.09998613,
  fees: 0.0000063,
  tokenInfo: {
    versionType: 1,
    transactionType: 'SEND',
    tokenIdHex:
      '7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796',
    sendOutputs: ['0', '1230000000', '122170000000']
  },
  tokenIsValid: true
}

const mockConvert = {
  slpAddress: 'slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5',
  cashAddress: 'bchtest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2svtllzmlf',
  legacyAddress: 'mvQPGnzRT6gMWASZBMg7NcT3vmvsSKSQtf'
}

const mockTokenDetails = {
  tokenIdHex:
    'df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb',
  documentUri: '',
  symbol: 'NAKAMOTO',
  name: 'NAKAMOTO',
  decimals: 8,
  timestamp: '',
  containsBaton: true,
  versionType: 1
}

const mockTokenStats = {
  qty_valid_txns_since_genesis: 241,
  qty_valid_token_utxos: 151,
  qty_valid_token_addresses: 113,
  qty_token_circulating_supply: '20995990',
  qty_token_burned: '4010',
  qty_token_minted: '21000000',
  qty_satoshis_locked_up: 81900
}

const mockBalance = {
  _id: 'simpleledger:qp9d8mn8ypryfvea2mev0ggc3wg6plpn4suuaeuss3',
  token_balance: '1000'
}

const mockTransactions = [
  {
    txid: 'a302f045be8efa1cd982833a7f187ff4fac8baac36da0c887eb2787d8b45e2af',
    tokenDetails: {
      valid: true,
      detail: {
        decimals: null,
        tokenIdHex:
          '495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a',
        timestamp: null,
        transactionType: 'MINT',
        versionType: 1,
        documentUri: null,
        documentSha256Hex: null,
        symbol: null,
        name: null,
        batonVout: 2,
        containsBaton: true,
        genesisOrMintQuantity: {
          $numberDecimal: '1000'
        },
        sendOutputs: null
      },
      invalidReason: null,
      schema_version: 30
    }
  }
]

const mockFoobar = {
  c: [],
  u: []
}

const mockSingleValidTxid = {
  c: [
    {
      _id: '5d965fc27f1cf2184ca2fe73',
      tx: {
        h: '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockTwoValidTxid = {
  c: [
    {
      _id: '5d965fc27f1cf2184ca2fe73',
      tx: {
        h: '77872738b6bddee6c0cbdb9509603de20b15d4f6b26602f629417aec2f5d5e8d'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    },
    {
      _id: '5d71e69758380a002c492a90',
      tx: {
        h: '552112f9e458dc7d1d8b328b0a6685e8af74a64b60b6846e7c86407f27f47e42'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockTwoRedundentTxid = {
  c: [
    {
      _id: '5db99c72a391ae2afd604bde',
      tx: {
        h: 'd56a2b446d8149c39ca7e06163fe8097168c3604915f631bc58777d669135a56'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockPsfToken = {
  c: [
    {
      _id: '5fcaf6152898f9887902986c',
      tx: {
        h: 'cdfed769ef7b69e09be06d2821b88598d9a5d711b8f9bd369763c78b7a578fbc'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockTxHistory = [
  {
    tx: {
      h: '3a7646b3976a8745928c7192c8dde989bfa275fa6d7bce950180ab8002cf6cef'
    },
    in: [
      {
        i: 0,
        e: {
          h: '7bdd586ebd1e5f3dfd5295ab6e896c48b25855ab77a72c035ce1e7aacc965c2d',
          i: 1,
          s:
            'RzBEAiAsu5o9EnxgZChjxKygxhGLhlfxJJbQfd4PP/vp2od3fAIgPpMqg+Sp4YpiInQZ6weJwELq8LEIrHXJpueBz7yF5gRBIQLsyL3809mRphc/+tPAcTQO5bi0kqZRFKpKIHXE3qN8Rw==',
          a: 'simpleledger:qrrrpqmdkggpnw0czwg0jgcjd7yhu25jy5zxh2gqdq'
        }
      },
      {
        i: 1,
        e: {
          h: 'df49feff24dc34a10a44a0cbd7c908d964801ec7218512c84574fbce698535f0',
          i: 3,
          s:
            'SDBFAiEAhW3zbKTlPrOXD2E2oEcNof6vCMPGYIg8vOVSE9c8IakCIFLg/gxydG9eL8HMAzkScGElKWJRnfhVMpMHU3evNcrZQSEDRS7F+pSC8OxSldsT4FctJLZBU7f2+FDiE05ae1xqtN0=',
          a: 'simpleledger:qpkpeqfslejw5pptzcy25h2jxhsc9k0vts43n26up0'
        }
      }
    ],
    out: [
      {
        e: {
          v: 0,
          i: 0,
          s:
            'agRTTFAAAQEEU0VORCA46XxdfTWFosvz+VgMgsozmF+csIRdTcziIMtwn5U4sAgAAAAAAJiWgAgAAAAAJHfU+g=='
        }
      },
      {
        e: {
          v: 546,
          i: 1,
          s: 'dqkUqo4lVohqOK6rDd7nIIkFQ6Uf41aIrA==',
          a: 'simpleledger:qz4guf2k3p4r3t4tph0wwgyfq4p628lr2c0cvqplza'
        }
      },
      {
        e: {
          v: 546,
          i: 2,
          s: 'dqkUgYSfxf90wVkERCiOMyh16iB4d92IrA==',
          a: 'simpleledger:qzqcf879la6vzkgygs5guvegwh4zq7rhm5nu0pljjl'
        }
      },
      {
        e: {
          v: 21849,
          i: 3,
          s: 'dqkUxjCDbbIQGbn4E5D5IxJviX4qkiWIrA==',
          a: 'simpleledger:qrrrpqmdkggpnw0czwg0jgcjd7yhu25jy5zxh2gqdq'
        }
      }
    ],
    slp: {
      detail: {
        decimals: 8,
        tokenIdHex:
          '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
        transactionType: 'SEND',
        versionType: 1,
        documentUri: 'psfoundation.cash',
        documentSha256Hex: null,
        symbol: 'PSF',
        name: 'Permissionless Software Foundation',
        txnBatonVout: null,
        txnContainsBaton: false,
        outputs: [
          {
            address: 'simpleledger:qz4guf2k3p4r3t4tph0wwgyfq4p628lr2c0cvqplza',
            amount: '0.1'
          },
          {
            address: 'simpleledger:qzqcf879la6vzkgygs5guvegwh4zq7rhm5nu0pljjl',
            amount: '6.11833082'
          }
        ]
      }
    },
    blk: {
      h: '000000000000000001a47bf337ca211c1e7218234d0d70117c64d6f213f5dacb',
      i: 634833,
      t: 1589300214
    }
  },
  {
    tx: {
      h: '3b11b48cab1e7c8384facf482b3f6bfe659a58245ab4aa4147b42b5cb2a5fac5'
    },
    in: [
      {
        i: 0,
        e: {
          h: 'e4e1e1f6b502cbd42f69b919634cea3e37fc8595e6ca800e0a7d8f6dcdfb249e',
          i: 3,
          s:
            'SDBFAiEAjCGRmU28x24LMTwg5XqC+fLf3zGhTYCsSWpmF8Eshq0CIAJhxAKMbwKWC4ASmjWzplpno2ch+hGNUD6HNWOdbd4SQSECeRsZo5Fl29g0A9bfJo1E/WIdowWBsLblyxWnEB7ViFE=',
          a: 'simpleledger:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qznkmw3s7'
        }
      },
      {
        i: 1,
        e: {
          h: '438420345dd8b7fb4ea74aaf2e3090f44899bf3c71662243946a441de6dae720',
          i: 2,
          s:
            'SDBFAiEAhmLYL4QY3mvZo3/i0XG9PJAYMruw3MaGOLJ3Z4si7hwCIAaaGwRnj/cZK3L/KKFBoMtItpGRZ10GowNN//vgn6PKQSECeRsZo5Fl29g0A9bfJo1E/WIdowWBsLblyxWnEB7ViFE=',
          a: 'simpleledger:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qznkmw3s7'
        }
      }
    ],
    out: [
      {
        e: {
          v: 0,
          i: 0,
          s:
            'agRTTFAAAQEEU0VORCCk+1wtoaoGTiUBikP5FlBABx2emEuhkMIip/WQU6+EsggAAAAAAA9CQAgAAAAXQnHEwA=='
        }
      },
      {
        e: {
          v: 546,
          i: 1,
          s: 'dqkUqo4lVohqOK6rDd7nIIkFQ6Uf41aIrA==',
          a: 'simpleledger:qz4guf2k3p4r3t4tph0wwgyfq4p628lr2c0cvqplza'
        }
      },
      {
        e: {
          v: 546,
          i: 2,
          s: 'dqkUWQQVny9pv6Y+76cSYzoNltwufoiIrA==',
          a: 'simpleledger:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qznkmw3s7'
        }
      },
      {
        e: {
          v: 43074,
          i: 3,
          s: 'dqkUWQQVny9pv6Y+76cSYzoNltwufoiIrA==',
          a: 'simpleledger:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qznkmw3s7'
        }
      }
    ],
    slp: {
      detail: {
        decimals: 2,
        tokenIdHex:
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        transactionType: 'SEND',
        versionType: 1,
        documentUri: 'troutsblog.com',
        documentSha256Hex: null,
        symbol: 'TROUT',
        name: "Trout's test token",
        txnBatonVout: null,
        txnContainsBaton: false,
        outputs: [
          {
            address: 'simpleledger:qz4guf2k3p4r3t4tph0wwgyfq4p628lr2c0cvqplza',
            amount: '10000'
          },
          {
            address: 'simpleledger:qpvsg9vl9a5mlf37a7n3yce6pktdctn73qznkmw3s7',
            amount: '998990000'
          }
        ]
      }
    },
    blk: {
      h: '000000000000000002a4ee2ed6fe8a764ffef0b2556f545ca0b3ef39ecd2b7c4',
      i: 634832,
      t: 1589297145
    }
  }
]

const mockValidateBulk = {
  c: [
    {
      _id: '5fcc1ae2aff6379ca5bbb213',
      tx: {
        h: '336bfe2168aac4c3303508a9e8548a0d33797a83b85b76a12d845c8d6674f79d'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    },
    {
      _id: '5fc9b4db4d54eece25b52762',
      tx: {
        h: 'daf4d8b8045e7a90b7af81bfe2370178f687da0e545511bce1c9ae539eba5ffd'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    },
    {
      _id: '5fc989a14d54eece25af88a6',
      tx: {
        h: '2bf691ad3679d928fef880b8a45b93b233f8fa0d0a92cf792313dbe77b1deb74'
      },
      slp: {
        valid: false,
        invalidReason: 'Token outputs are greater than valid token inputs.'
      }
    },
    {
      _id: '5fc974d14d54eece25ad5df2',
      tx: {
        h: '3a4b628cbcc183ab376d44ce5252325f042268307ffa4a53443e92b6d24fb488'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

module.exports = {
  mockList,
  mockSingleToken,
  mockConvert,
  mockTokenDetails,
  mockTokenStats,
  mockTx,
  mockBalance,
  mockTransactions,
  mockSingleTokenError,
  mockSingleAddress,
  mockFoobar,
  mockSingleValidTxid,
  mockTwoValidTxid,
  mockTwoRedundentTxid,
  mockTxHistory,
  mockPsfToken,
  mockValidateBulk
}
