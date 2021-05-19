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

const mockNftGroup = {
  decimals: 0,
  timestamp: '2021-05-03 10:36:01',
  timestamp_unix: 1620038161,
  versionType: 129,
  documentUri: 'psfoundation.cash',
  symbol: 'PSF.TEST.GROUP',
  name: 'PSF Test NFT Group',
  containsBaton: true,
  id: '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a',
  documentHash: null,
  initialTokenQty: 1000000,
  blockCreated: 686117,
  totalMinted: null,
  totalBurned: null,
  circulatingSupply: null
}

const mockNftChildren = [
  {
    decimals: 0,
    timestamp: '2021-05-03 11:59:30',
    timestamp_unix: 1620043170,
    versionType: 65,
    documentUri: 'psfoundation.cash',
    symbol: 'PSF.TEST.CHILD.1',
    name: 'PSF Test NFT Child #1',
    containsBaton: false,
    id: '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9',
    documentHash: null,
    initialTokenQty: 1,
    nftParentId: '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a',
    blockCreated: 686130,
    totalMinted: null,
    totalBurned: null,
    circulatingSupply: null,
    // only in axios.data.t
    transactionType: 'GENESIS',
    tokenIdHex: '45a30085691d6ea586e3ec2aa9122e9b0e0d6c3c1fd357decccc15d8efde48a9'
  },
  {
    decimals: 0,
    timestamp: '2021-05-03 11:59:30',
    timestamp_unix: 1620043170,
    versionType: 65,
    documentUri: 'psfoundation.cash',
    symbol: 'PSF.TEST.CHILD.2',
    name: 'PSF Test NFT Child #2',
    containsBaton: false,
    id: '928ce61fe1006b1325a0ba0dce700bf83986a6f0691ba26e121c9ac035d12a55',
    documentHash: null,
    initialTokenQty: 1,
    nftParentId: '68cd33ecd909068fbea318ae5ff1d6207cf754e53b191327d6d73b6916424c0a',
    blockCreated: 686130,
    totalMinted: null,
    totalBurned: null,
    circulatingSupply: null,
    // only in axios.data.t
    transactionType: 'GENESIS',
    tokenIdHex: '928ce61fe1006b1325a0ba0dce700bf83986a6f0691ba26e121c9ac035d12a55'
  }
]

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

const mockValidate3Bulk = {
  c: [
    {
      _id: '5fcaf60b2898f98879029754',
      tx: {
        h: 'daf4d8b8045e7a90b7af81bfe2370178f687da0e545511bce1c9ae539eba5ffd'
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    },
    {
      _id: '5fcaf5382898f988790275d0',
      tx: {
        h: '2bf691ad3679d928fef880b8a45b93b233f8fa0d0a92cf792313dbe77b1deb74'
      },
      slp: {
        valid: false,
        invalidReason: 'Token outputs are greater than valid token inputs.'
      }
    }
  ],
  u: []
}

const mockStatus = {
  _id: '5fe408b7cd2bd2000f7fdd0a',
  version: '1.0.0-beta-rc13',
  versionHash: 'bb4a805610b9e4d67c1595b716df36190c75e8b1',
  deplVersionHash: null,
  startCmd: 'node index run',
  context: 'SLPDB',
  lastStatusUpdate: {
    utc: 'Thu, 24 Dec 2020 03:19:19 GMT',
    unix: 1608779959
  },
  lastIncomingTxnZmq: {
    utc: 'Thu, 24 Dec 2020 03:19:16 GMT',
    unix: 1608779956
  },
  lastIncomingBlockZmq: {
    utc: 'Thu, 24 Dec 2020 03:00:27 GMT',
    unix: 1608778827
  },
  lastOutgoingTxnZmq: null,
  lastOutgoingBlockZmq: null,
  state: 'RUNNING',
  stateHistory: [
    {
      utc: 'Mon, 07 Dec 2020 15:26:23 GMT',
      state: 'STARTUP_BLOCK_SYNC'
    },
    {
      utc: 'Mon, 07 Dec 2020 15:52:20 GMT',
      state: 'RUNNING'
    },
    {
      utc: 'Tue, 08 Dec 2020 14:42:29 GMT',
      state: 'PRE_STARTUP'
    },
    {
      utc: 'Tue, 08 Dec 2020 14:42:29 GMT',
      state: 'STARTUP_BLOCK_SYNC'
    },
    {
      utc: 'Tue, 08 Dec 2020 14:59:53 GMT',
      state: 'RUNNING'
    },
    {
      utc: 'Tue, 08 Dec 2020 19:35:36 GMT',
      state: 'EXITED_ON_ERROR'
    },
    {
      utc: 'Tue, 08 Dec 2020 19:35:36 GMT',
      state: 'EXITED_ON_ERROR'
    },
    {
      utc: 'Tue, 08 Dec 2020 19:35:49 GMT',
      state: 'PRE_STARTUP'
    },
    {
      utc: 'Tue, 08 Dec 2020 19:35:49 GMT',
      state: 'STARTUP_BLOCK_SYNC'
    },
    {
      utc: 'Tue, 08 Dec 2020 19:53:04 GMT',
      state: 'RUNNING'
    }
  ],
  network: 'mainnet',
  bchBlockHeight: 667203,
  bchBlockHash:
    '0000000000000000035f9c26b9ef3db37eba8c9351218c67c92d80444b867858',
  slpProcessedBlockHeight: 667203,
  mempoolInfoBch: {
    loaded: true,
    size: 441,
    bytes: 192651,
    usage: 663056,
    maxmempool: 300000000,
    mempoolminfee: 0.00001,
    minrelaytxfee: 0.00001
  },
  mempoolSizeSlp: 68,
  tokensCount: 77879,
  pastStackTraces: [
    '[Tue, 08 Dec 2020 19:35:36 GMT] MongoServerSelectionError: connection <monitor> to 172.17.0.1:12301 timed out\n    at Timeout._onTimeout (/home/safeuser/SLPDB/node_modules/mongodb/lib/core/sdam/topology.js:438:30)\n    at listOnTimeout (internal/timers.js:554:17)\n    at processTimers (internal/timers.js:497:7)',
    '[Tue, 08 Dec 2020 19:35:36 GMT] MongoServerSelectionError: connection <monitor> to 172.17.0.1:12301 timed out\n    at Timeout._onTimeout (/home/safeuser/SLPDB/node_modules/mongodb/lib/core/sdam/topology.js:438:30)\n    at listOnTimeout (internal/timers.js:554:17)\n    at processTimers (internal/timers.js:497:7)'
  ],
  doubleSpends: [
    {
      txo:
        '3e377f67e9d065f02e47633d847cdb04b0679d51baccdc0feea5297529e330b5:820',
      details: {
        originalTxid:
          'dc148149d25a546fffe0b207c62b192811c288481df5f43f1f76f67b6004f98c',
        current:
          'de12db60e253c378eeebb1df85153168a998db8267ec54b38589cc31348b2b8d',
        time: {
          utc: 'Sat, 19 Dec 2020 02:25:37 GMT',
          unix: 1608344737
        }
      }
    },
    {
      txo: '4b7e94fc59a685bce31ee9444d20ebb0ae0478111a8bfa7ec9b5c381e2657191:2',
      details: {
        originalTxid:
          'a4e00c025c07a770874ecc6b2d1004fe3c561f2aceb0a8b95996e26709df1a57',
        current:
          '33ccab4a971331897bb3ff3978366e3575c54d83ae1a35984e50d93cffe66b95',
        time: {
          utc: 'Sat, 19 Dec 2020 02:33:28 GMT',
          unix: 1608345208
        }
      }
    },
    {
      txo: 'bd5ac3d02652038cc888922e50c9b57db0dfdbb5b26bb28a2e85fd28493e85e1:2',
      details: {
        originalTxid:
          '53032355ab142ac050f1e37445ecb19ad22c5331185df7b3173e88563194ba18',
        current:
          '0b3ab983c5abb1ceb6f60035ff869e159e27ab5d2a4173d0d6ce027348d4dbdd',
        time: {
          utc: 'Sat, 19 Dec 2020 04:21:27 GMT',
          unix: 1608351687
        }
      }
    },
    {
      txo:
        '8d91432598943cc22b93d10df6808abccba4baebdf2273b375ce3616a2001c07:573',
      details: {
        originalTxid:
          '53032355ab142ac050f1e37445ecb19ad22c5331185df7b3173e88563194ba18',
        current:
          '7ddc241b62625ddc1d134ae17e74bf2b6f63a4c28e3c3a4f11d833270bdebcdb',
        time: {
          utc: 'Sat, 19 Dec 2020 04:26:12 GMT',
          unix: 1608351972
        }
      }
    },
    {
      txo: 'ff3a9268952408217f60f1689aa1137e929e6572413e429554996ec3e9b223b5:2',
      details: {
        originalTxid:
          '342adc882eff630aa7b50098adaace3626c1e60acbdf937e41832c4508bbdb4b',
        current:
          '01538a27e7e164bd52a9fd3df36cd724846f44a4c26aea8764ee982486b580ff',
        time: {
          utc: 'Sat, 19 Dec 2020 12:58:36 GMT',
          unix: 1608382716
        }
      }
    },
    {
      txo:
        '9f7de7ea735d46fbb9214353fec0b250f48a24340e0909eecd83f53817b6aaa3:314',
      details: {
        originalTxid:
          '342adc882eff630aa7b50098adaace3626c1e60acbdf937e41832c4508bbdb4b',
        current:
          '01538a27e7e164bd52a9fd3df36cd724846f44a4c26aea8764ee982486b580ff',
        time: {
          utc: 'Sat, 19 Dec 2020 12:58:36 GMT',
          unix: 1608382716
        }
      }
    },
    {
      txo: 'ff28ad4063faa250797fa39c823b919d157ecae82b8bf68199eb0b9babbb0c12:2',
      details: {
        originalTxid:
          'eced12b6e07e4d830edf6d3244055ba22e953065070985755c9e7f9ea7626d1d',
        current:
          '512073e40e033106c45af47acfd05092b0206ac276bda459f76dfa019a0e257c',
        time: {
          utc: 'Sat, 19 Dec 2020 12:58:38 GMT',
          unix: 1608382718
        }
      }
    },
    {
      txo:
        '9f7de7ea735d46fbb9214353fec0b250f48a24340e0909eecd83f53817b6aaa3:316',
      details: {
        originalTxid:
          '53cffad1ffd9de20355f89ee0310cd39876c21e2d2a9d5b09548286de1e78565',
        current:
          'a988c9f46f97de27eccd4f50e1bba751cdc9c49a6cac31de2f4dbf3763fb4ab3',
        time: {
          utc: 'Sat, 19 Dec 2020 12:58:45 GMT',
          unix: 1608382725
        }
      }
    },
    {
      txo:
        '1a57786c472034b2d3d944a3cad69447c30ed5de46bd708ddead33f946ea2578:10',
      details: {
        originalTxid:
          'eced12b6e07e4d830edf6d3244055ba22e953065070985755c9e7f9ea7626d1d',
        current:
          '8ef975bd11d82c3dfb6645cc15eeaecebde23423b6506daa5145d3b20c02fab5',
        time: {
          utc: 'Sat, 19 Dec 2020 13:01:30 GMT',
          unix: 1608382890
        }
      }
    },
    {
      txo:
        '9f7de7ea735d46fbb9214353fec0b250f48a24340e0909eecd83f53817b6aaa3:317',
      details: {
        originalTxid:
          '5bf0b00b41a9cc1068d8573f0fb65e875743ce3ea5a3e521fff960da9223d508',
        current:
          '4f3bf7452f5409964cdb9f68a493b2c1f89dd16fc6eb1cc6d2b1dc753c7bfb59',
        time: {
          utc: 'Sat, 19 Dec 2020 13:04:46 GMT',
          unix: 1608383086
        }
      }
    },
    {
      txo:
        '1a57786c472034b2d3d944a3cad69447c30ed5de46bd708ddead33f946ea2578:11',
      details: {
        originalTxid:
          'f1973c96dabf923f7f1e65630366921da9a806316f3e4f2478cbd754d52f6c70',
        current:
          '76493aaa8bdcb21bb45452250f9518674ea94b3e70fb890252278c9f8bfe3cef',
        time: {
          utc: 'Sat, 19 Dec 2020 13:06:31 GMT',
          unix: 1608383191
        }
      }
    },
    {
      txo:
        '1a57786c472034b2d3d944a3cad69447c30ed5de46bd708ddead33f946ea2578:12',
      details: {
        originalTxid:
          '15b22f6c97a3390c13ae79a61eb9beb34ab87d2245bf8e63d91d7b2477ccdf00',
        current:
          '6e529eeecd268b1763467152ff76a427c80a26750229de3ad0edbfb2b40ee43a',
        time: {
          utc: 'Sat, 19 Dec 2020 13:07:37 GMT',
          unix: 1608383257
        }
      }
    },
    {
      txo: 'c75126b129584314d7657ce7140f4aef64ff410053a3d9017a13307b778d4e16:2',
      details: {
        originalTxid:
          'cf2234e2a71a5ae7cf525c2ced332c16bde86734d841649913b4ce698a43506d',
        current:
          'f98a430d9772962353cb15a58d447d3de056abde41730b92d9301d7510d1d04c',
        time: {
          utc: 'Sat, 19 Dec 2020 14:52:28 GMT',
          unix: 1608389548
        }
      }
    },
    {
      txo:
        '9f7de7ea735d46fbb9214353fec0b250f48a24340e0909eecd83f53817b6aaa3:343',
      details: {
        originalTxid:
          'cf2234e2a71a5ae7cf525c2ced332c16bde86734d841649913b4ce698a43506d',
        current:
          'f98a430d9772962353cb15a58d447d3de056abde41730b92d9301d7510d1d04c',
        time: {
          utc: 'Sat, 19 Dec 2020 14:52:28 GMT',
          unix: 1608389548
        }
      }
    },
    {
      txo:
        '22fa91e7961388ec071254c65cccf824d7923a0291af0967394fc7bffb6185c1:25',
      details: {
        originalTxid:
          '5ed601fb5b2c6fee6eb1298671471108cf656f5d19186db484c2a6711f0867c8',
        current:
          'a30535841e874fe7ddefe6285bc44e5f932d1866c343b3298448985c428049a1',
        time: {
          utc: 'Sat, 19 Dec 2020 18:41:13 GMT',
          unix: 1608403273
        }
      }
    },
    {
      txo:
        '22fa91e7961388ec071254c65cccf824d7923a0291af0967394fc7bffb6185c1:26',
      details: {
        originalTxid:
          'a7015340be3ff27b1773208bf7c4501811e9adfb11363c11a7ac080946fb1cd2',
        current:
          'b9959428becca1c0850409a960153a55fa8cacac3ad5c7b0ba67c57e46814baf',
        time: {
          utc: 'Sat, 19 Dec 2020 18:42:13 GMT',
          unix: 1608403333
        }
      }
    },
    {
      txo:
        '22fa91e7961388ec071254c65cccf824d7923a0291af0967394fc7bffb6185c1:27',
      details: {
        originalTxid:
          '72435b1d8234d5ca00c6653beec318c3d40f4e902f0fec892f769125bdfc0987',
        current:
          '43277c2fffa2a7ff632fd2bdd0a2be950523816c42012fa00efa860ade428127',
        time: {
          utc: 'Sat, 19 Dec 2020 18:53:26 GMT',
          unix: 1608404006
        }
      }
    },
    {
      txo: 'b46d46d2d8b081cf4dd3fbf4bb1d36c8f22954e92f999a07c730be52006303ee:2',
      details: {
        originalTxid:
          '93aca660517a8ea847ca5bb39dfa1b26ae72f2eabfedc7cb3ef6e804c293c697',
        current:
          '377c89f649de123c52ef23a1f0ec844aa6ac032c4ec1242b59ca15e1b64a883d',
        time: {
          utc: 'Sat, 19 Dec 2020 20:33:14 GMT',
          unix: 1608409994
        }
      }
    },
    {
      txo:
        '9f7de7ea735d46fbb9214353fec0b250f48a24340e0909eecd83f53817b6aaa3:409',
      details: {
        originalTxid:
          '4f355dfeed4a71ec0fd10688ddb3c03ea10db7629e844adfb033a859f12dc87f',
        current:
          '377c89f649de123c52ef23a1f0ec844aa6ac032c4ec1242b59ca15e1b64a883d',
        time: {
          utc: 'Sat, 19 Dec 2020 20:33:14 GMT',
          unix: 1608409994
        }
      }
    },
    {
      txo: '4bd177144edbf495f614b839c5828ec6c2d21b4a5a478b6324d681b7ecdce976:2',
      details: {
        originalTxid:
          '4f355dfeed4a71ec0fd10688ddb3c03ea10db7629e844adfb033a859f12dc87f',
        current:
          '9c480d23e99fc3a31558ffb8a402bc819bf0906ca21351749db4d5fceca263b6',
        time: {
          utc: 'Sat, 19 Dec 2020 20:33:16 GMT',
          unix: 1608409996
        }
      }
    },
    {
      txo:
        '190c84d8cb06fe750fcbf0bd11c62e23fa60cd4f7c970a1079ac746e270982be:155',
      details: {
        originalTxid:
          '93aca660517a8ea847ca5bb39dfa1b26ae72f2eabfedc7cb3ef6e804c293c697',
        current:
          '75e3759d5167395aa1dca327b9b042eb1b86e893bdffc66c2480e8194c2cdc61',
        time: {
          utc: 'Sat, 19 Dec 2020 20:45:04 GMT',
          unix: 1608410704
        }
      }
    }
  ],
  reorgs: [],
  mongoDbStats: {
    db: 'slpdb',
    collections: 5,
    views: 0,
    objects: 2495075,
    avgObjSize: 3188.4621913168944,
    dataSize: 7586.910535812378,
    storageSize: 3353.39453125,
    indexes: 71,
    indexSize: 1490.08203125,
    totalSize: 4843.4765625,
    scaleFactor: 1048576,
    fsUsedSize: 74352.5859375,
    fsTotalSize: 153676.98046875,
    ok: 1
  },
  publicUrl: 'fullstack--bchn-02',
  telemetryHash: null,
  system: {
    loadAvg1: 0.04,
    loadAvg5: 0.03,
    loadAvg15: 0,
    platform: 'linux',
    cpuCount: 8,
    freeMem: 5832.546875,
    totalMem: 31360.8828125,
    uptime: 1603692,
    processUptime: 1323812.053445836
  }
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
  mockValidateBulk,
  mockValidate3Bulk,
  mockStatus,
  mockNftGroup,
  mockNftChildren
}
