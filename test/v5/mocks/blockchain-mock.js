/*
  This library contains mocking data for running unit tests on the address route.
*/

'use strict'

const mockBlockHash =
  '00000000000000645dec6503d3f5eafb0d2537a7a28f181d721dec7c44154c79'

const mockBlockchainInfo = {
  chain: 'test',
  blocks: 1267694,
  headers: 1267694,
  bestblockhash:
    '000000000000013eaf80d1e157e32804c36a58ad0bb26ca59833880c80298780',
  difficulty: 4105763.969035785,
  mediantime: 1542131305,
  verificationprogress: 0.9999968911571566,
  chainwork: '00000000000000000000000000000000000000000000003f0443b0b5f02ce255',
  pruned: false,
  softforks: [
    { id: 'bip34', version: 2, reject: { status: true } },
    { id: 'bip66', version: 3, reject: { status: true } },
    { id: 'bip65', version: 4, reject: { status: true } }
  ],
  bip9_softforks: {
    csv: {
      status: 'active',
      startTime: 1456790400,
      timeout: 1493596800,
      since: 770112
    }
  }
}

const mockChainTips = [
  {
    height: 1267696,
    hash: '000000000000035bfc43a642ebbff8cfc1e88b1d564de8b0a6c7e2797eeafb21',
    branchlen: 0,
    status: 'active'
  },
  {
    height: 1267581,
    hash: '000000000001bd12e4124207682563135b21353ca3087bc6b0c409f7f9e1da91',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1267375,
    hash: '00000000702036979df70236bcc45dfc72d43d5d0e6834007afa1fa627e49587',
    branchlen: 1036,
    status: 'headers-only'
  },
  {
    height: 1266979,
    hash: '00000000e851abbde2174ccdc5c2508b909f81f23c4b7abeac864eee1a4891c7',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266973,
    hash: '000000007e1324d2900ed70947f89ab8fd4a267e87c9244c333215659a7370d5',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266967,
    hash: '000000000f37f12843d4800f50ec4de44dce0432e4d448242d43ff04a7a2948d',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266963,
    hash: '00000000ae11ec99e88898cbd72567cb4cb79e7fc13243357bef79632769deb4',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266962,
    hash: '000000004f97851259b4460a049e44fa5bd4beadee04a85bf81bd2e90c4f24f9',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266950,
    hash: '00000000d12a0e4a827f73ecaadb563df7e99817294939f2be8e943079dc60b2',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266944,
    hash: '00000000612d16af273217818e8e7ac5014a19f68ed04e1bc897b1be0a9c744f',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266941,
    hash: '0000000000002b91cdb15cacf3368da2c9ffce511d64092193b507dad75f4a27',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266896,
    hash: '000000000002745f67a66617b1f9f65c2dfb4c4b8a9ed9b1320b98d3ca46cbe5',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266481,
    hash: '0000000000036babee3ba7654cddb29a9fe5e85c9fbeb44bb53d5ffb694b9670',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266452,
    hash: '00000000502c3ab1490e0839780a4b441bbe21507c454545941e6adcde73c2ff',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1266336,
    hash: '000000001c9a0b7cd9eb2210f69d5a9a3f4546ba3707deb40993d729190582d7',
    branchlen: 10,
    status: 'headers-only'
  },
  {
    height: 1266097,
    hash: '000000000028ac0fbd18afe6f001f70cb7549bd2b3082d754dde88ee236368a2',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1265522,
    hash: '00000000000000c6df7a2063030e6ce51399e470cc46e4bf6d67aa3f0feca98d',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1265470,
    hash: '0000000000168e6442a595a02340fccf8dc2b0e8912c632d39e1f870685f6d7c',
    branchlen: 2,
    status: 'valid-fork'
  },
  {
    height: 1265275,
    hash: '000000008bc2b37ae6af1b886b52e7e1c1122c12badc4ae6c13df64f789267cf',
    branchlen: 11027,
    status: 'headers-only'
  },
  {
    height: 1265257,
    hash: '00000000005bc3e9973d7273211eab02ae02549c7ebae48764c0bd648d4d7bbe',
    branchlen: 114,
    status: 'valid-fork'
  },
  {
    height: 1265254,
    hash: '0000000000e5b909d3541857315e9ee103b042d9ba661f25cc3e8fb25a96c8ce',
    branchlen: 111,
    status: 'valid-fork'
  },
  {
    height: 1265245,
    hash: '000000000066eb8832f6f990baceb379536f437216e22475a6c1b9133d250cb8',
    branchlen: 102,
    status: 'valid-fork'
  },
  {
    height: 1264455,
    hash: '00000000000001befc1bb17a23208d0b77b2449e37093ce8fbb5e346b19cafcc',
    branchlen: 1,
    status: 'valid-headers'
  },
  {
    height: 1264373,
    hash: '00000000000001ed3747e04fb95054cac0358fb4d8009d1999fc3ea34413e84a',
    branchlen: 175,
    status: 'valid-fork'
  },
  {
    height: 1263912,
    hash: '00000000000004635aecbcb97edcd6f5396483338838cb40da804eb354c68bde',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1262906,
    hash: '00000000b31643d92a3e7c38e9755844fc8607e3f1055580a8ff28854e8a8ece',
    branchlen: 1,
    status: 'valid-fork'
  },
  {
    height: 1255749,
    hash: '000000001dde5b015a99137f4cba87871370f4b6fcfbcc8b126547e6c33177da',
    branchlen: 129,
    status: 'headers-only'
  },
  {
    height: 1188789,
    hash: '00000000af942ce4eb60b3213cbcb7c98a7330f1f8f1adb4b6376f5e822e15b2',
    branchlen: 92,
    status: 'headers-only'
  }
]

const mockMempoolInfo = {
  size: 87,
  bytes: 16816,
  usage: 66408,
  maxmempool: 300000000,
  mempoolminfee: 0
}

const mockRawMempool = [
  'db045bc3bd1088fa91f5ebb05c35cb9e2a91a22377f79b465cc6920b9893123c',
  '6b3df7febf2b9834f1409155f88b866dd516b36376eae00e2b455df82e290405'
]

const mockBlockHeaderConcise =
  '000000202ed2723e7590e2b937f6821a99d6764cb8799bf30f8e300000000000000000001d311c02df9a1e3f57b8dbdcf97ec8dbc3109a26779724c63e560b29ad9ea501e2af955d286403183049e39c'

const mockBlockHeader = {
  hash: '00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900',
  confirmations: 7,
  height: 1272859,
  version: 2147418112,
  versionHex: '7fff0000',
  merkleroot:
    '846f45604ec6cde2528933305dba80971e9ff0874f74d2811c7c690b2c32706d',
  time: 1544207139,
  mediantime: 1544202884,
  nonce: 641041470,
  bits: '1a09faea',
  difficulty: 1681035.704111868,
  chainwork: '00000000000000000000000000000000000000000000003fc4752e608403be04',
  previousblockhash:
    '0000000000003e467ebcb7e906645676c2f71b9ac520d6508bea45789b7c217d',
  nextblockhash:
    '00000000000006899041cdfd6c0b73a97730c362346dde479b77414ad7f25ace',
  nTx: 'some value'
}

const mockTxOut = {
  bestblock: '00000000003a7f19730dd9f172d7466658a5c8833dd03ed8f4ba36e3d857b5e7',
  confirmations: 10,
  value: 0.0001,
  scriptPubKey: {
    asm:
      'OP_DUP OP_HASH160 0ee020c07f39526ac5505c54fa1ab98490979b83 OP_EQUALVERIFY OP_CHECKSIG',
    hex: '76a9140ee020c07f39526ac5505c54fa1ab98490979b8388ac',
    reqSigs: 1,
    type: 'pubkeyhash',
    addresses: ['bchtest:qq8wqgxq0uu4y6k92pw9f7s6hxzfp9umsvtg39pzqf']
  },
  coinbase: false
}

const mockTxOutProof =
  '000000200798039affceb7a381e15dc62443c286efe7cae852393b656807000000000000cf9a7d6c654fd1c4558229a619a550ff749b373fa0f0027eed68b1abf6175d5c07c50f5cffff001d0452403b34000000070d0765da76980d542b5670d27ccda9e717073270f8921ad017deb7ee83fe6c4c22830a48cc8392197f1742a3d81805bd2aa4eb7469f38c74f674429d682cb87efcff1713fd0c388a50f0d11adf05363397ef79d16cdb786d47c941c2cb89f2588f42aced9c05f4203b4440616a9e4266ec47909b9580a643f402b5d4e82cc3cddd73df05a33abf6af3975d973d3033d10c4168a73d58d01f685a96d5a2519cd0de9c77faf3f8725ddf155cbdc8ab8102f173e2d0a0d74767f3bff22f588158d6d5bc71c079c7659cc864819c43877635007650502eb4060fcc9feec3280a41d602ad0a'

const mockAncestors = [
  '070504de968fba8a23a1362fd7fc0546a420663f2bcc18099d894a41ecf9cce5',
  '20af6b7fcd21a3f38bb65d32fe2d66fb1ae554ed9c00eaf1b17d7e81362381a9',
  '227e08663a812cf44d91106b09fc8493fe1a2b7c146f30ca09ebd86c9b84b2a5',
  '228833be79d4a833165ea199be160efcaeb9325e71e9455f424b27abc9688ba8',
  '2de27df02001e7243435cef6d41ea2312b94a5964912eb21466b936852c0b822',
  '2ef76ae690d6f6c9559e20358a75a0ce02250b9b8e80e0aa6f782576239f292a',
  '3e314678f52d52694726e6da88b94c9f0ea086d2f9af297b01d014b62247839f',
  '4773f840d5255f16c0e5effce48316d8b8824a1d3ddd5da275c5fd99e7b3ee42',
  '4804b97112da07e2c187516a915dd4cbd4a3814f3c900b8d08eb1d508ab0ac47',
  '4ca69f31081a256cb4711315336fe4358d8f04b67792ca5ee17b5f4089a2446a',
  '6ac17dce10ae3a3d1d8e6f42546ad9a4bb981e62cba8d48bab03e01b9ea38ae3',
  '6ce71182ef341c481a90d8b081a99d9788bdd91a917f9a6594fdfad2c2024a14',
  '8413343ac973fb0968ae1809faa8f0ddf18252975481daa683e88b04afa66ccd',
  '9430300f3d7ecdabe39671b6fd0e9c36f763f01a202e619c070554ddc5e8713e',
  '94f82b5a2cd1647d8168807ccfdebe41931ea1ab789a050d615f08000a63b624',
  '9848db6a7d2835002ca7e1097a685d75eb629f44df94007674635b45d0e97199',
  '98d809993353df6c4d55fda5e7b0ed2e383601cef1180a9aa9c87e67e8f4dd94',
  '9f5513a35ae8fad3dd061865a97d8127c914e3464527641c089993c06d092535',
  'a7201ac90abd2aa42112faa809181c45047b6988a2f649a70a1d5bfb95f46884',
  'a9f1284710c655357412a062b01efaeb174820613784ccbfe44b33b86a8bdbc4',
  'b814f44c9c8ee24a218b9f295a8c1831106b70c15ffe8aeb7534e10d99935fd0',
  'e130ccdcc94dc5eaa4ae37fa50e3ee96283b0e157616bc6e28454b64bae34f48',
  'e68dad4a7292105cfa84fcaef7f99e5d4f2ece9613ca625d4d2ebf61efa84118',
  'fe94caf5da672be3772d2304a6272eb8bc3d3f5cb4a886f39b7981e1485cf74b'
]
const mockBlockInfo = {
  verbosity0: '20000000',
  verbosity1: {
    hash: '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09',
    confirmations: 1,
    size: 3725,
    strippedsize: 3725,
    weight: 3725,
    height: 6725,
    version: 1,
    versionHex: '00000000',
    merkleroot: 'xxxx',
    tx: [
      '2afb8264508e2bf3e5288ccad01ed2ab766745b6b9747666b519d59212012c01',
      '18f40b1ae56bba3fa1934b737fbe46ed8d5ca40fa9aed95073eeb5a119530cd3',
      '349720d878547752607a69eb19e330592fee271fb5376cdfd811bee423558ed8',
      '35571c80e7d0e9247b467454ef147d1d5833c775bc2d4164b1bebd4c1f69164f',
      '480937e8efacdafeeb97d401ff0dd9ea8e8ddb27244cefa67a03621315bdb0e6',
      '523327469d0b90c0de9a905c2fe6e227278fc5b55b9d9911ca151e1c26647065',
      '61de4af971d94dbc741762f21dcef08b74b62863a56a1cb3496becdd8d47a858',
      '69f70a288403b5bba23030ccd05d2e5cb00394620fdae3b050cff9432cc590ce',
      '94472a90fbdba2eb2cba68308415181faedf3585c66b89efcbdb927a0c10ba23',
      'bc6f781f9e2f2df460f89995c5e1c7224e48ccbe1aa2a575961f3f5330259864',
      'f2d945a79bec5454a9ab4d570a150d81124daa308f1c81106a977d6413476944'
    ],
    time: 111,
    mediantime: 111,
    nonce: 111,
    bits: '1d00ffff',
    difficulty: 99.999,
    chainwork: 'xxxx',
    nTx: 1,
    previousblockhash:
      '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09',
    nextblockhash:
      '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09'
  },
  verbosity2: {
    hash: '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09',
    confirmations: 1,
    size: 3725,
    strippedsize: 3725,
    weight: 3725,
    height: 6725,
    version: 1,
    versionHex: '00000000',
    merkleroot: 'xxxx',
    tx: [
      {
        hex:
          '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000',
        txid:
          '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
        hash:
          '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
        size: 134,
        version: 1,
        locktime: 0,
        vin: [],
        vout: [],
        blockhash:
          '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048',
        confirmations: 581882,
        time: 1231469665,
        blocktime: 1231469665
      }
    ],
    time: 111,
    mediantime: 111,
    nonce: 111,
    bits: '1d00ffff',
    difficulty: 99.999,
    chainwork: 'xxxx',
    nTx: 1,
    previousblockhash:
      '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09',
    nextblockhash:
      '00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09'
  }
}
module.exports = {
  mockBlockHash,
  mockBlockchainInfo,
  mockChainTips,
  mockMempoolInfo,
  mockRawMempool,
  mockBlockHeaderConcise,
  mockBlockHeader,
  mockTxOut,
  mockTxOutProof,
  mockAncestors,
  mockBlockInfo
}
