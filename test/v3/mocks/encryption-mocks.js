/*
  Mock data for the encryption test library
*/

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0',
  balance: '582434',
  totalReceived: '213083250',
  totalSent: '212500816',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 12,
  txids: [
    'c42f8f16d3baa2ee343ea89ef110dfe094992379d08edd30887b8ca7ee671c9a',
    '1afcc63b244182647909539ebe3f4a44b8ea4120a95edb8d9eebe5347b9491bb',
    'e4a0ac48ff3f42fc342717a2a3d34248e5e85bae79d59bd20e1b60e61b1c500f',
    '0f9b49cafeb9ae1d741cdb12137c92816aa8470944c270a78ba2e610bd59190d',
    'ceb0cab0e37b59caf3ca29e1a698d19ff47f2827dd09cb2f3b91b9100b1dad1c',
    '8bc2134c7e48e56e1769b3d7c4c1e3a0acc68e1e58160eee6fa67f3208c07262',
    'b3792d28377b975560e1b6f09e48aeff8438d4c6969ca578bd406393bd50bd7d',
    'ecc1b51bac767880382bf3190ff17abf78d0936843a022a943d871116ed50368',
    '9ea667bcfc9cd337bd6c5583d8094c1b1942bd2015d95b54189deac5070eeff0',
    '6960255abe64893073921e96bf3c053c82686e0fc22a565494fbe2a31e766975',
    '7e9aa7a74de2b30200a2d6fc748ff35a0c753221444194f720bb7f61ef1d9153',
    'eff00a9538487ff44243c75fb13de19b5783454c42c81b9aff9afbfd09cbaec3'
  ]
}

const mockTxDetails = {
  txid: '1afcc63b244182647909539ebe3f4a44b8ea4120a95edb8d9eebe5347b9491bb',
  hash: '1afcc63b244182647909539ebe3f4a44b8ea4120a95edb8d9eebe5347b9491bb',
  version: 1,
  size: 437,
  locktime: 0,
  vin: [
    {
      txid: 'c42f8f16d3baa2ee343ea89ef110dfe094992379d08edd30887b8ca7ee671c9a',
      vout: 0,
      scriptSig: {
        asm:
          '30450221008052d3b067418d53585fb8f91e1b57cf3c040dc9c07a70f393ed663b3f7502c50220749aa8e09ac922e78cb474c8097873cfb2634108d7acaa7db32a73a35743da97[ALL|FORKID] 044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c',
        hex:
          '4830450221008052d3b067418d53585fb8f91e1b57cf3c040dc9c07a70f393ed663b3f7502c50220749aa8e09ac922e78cb474c8097873cfb2634108d7acaa7db32a73a35743da974141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c'
      },
      sequence: 4294967295
    },
    {
      txid: 'e4a0ac48ff3f42fc342717a2a3d34248e5e85bae79d59bd20e1b60e61b1c500f',
      vout: 1,
      scriptSig: {
        asm:
          '3044022050d7fe7cdcec81eefa0987b88ddb83274d8e9063d927090dc4c2d1db76c512d302207dc1eea439a627476265ed87f59cc9823fb572ffc2640f0218d7bddc9a621c6e[ALL|FORKID] 044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c',
        hex:
          '473044022050d7fe7cdcec81eefa0987b88ddb83274d8e9063d927090dc4c2d1db76c512d302207dc1eea439a627476265ed87f59cc9823fb572ffc2640f0218d7bddc9a621c6e4141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c'
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.47,
      n: 0,
      scriptPubKey: {
        asm:
          'OP_DUP OP_HASH160 7ab928d0b41194411a2e87a782b688c7cc69ba46 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9147ab928d0b41194411a2e87a782b688c7cc69ba4688ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: ['bitcoincash:qpatj2xsksgegsg696r60q4k3rruc6d6gc3srp333v']
      }
    },
    {
      value: 0.00531373,
      n: 1,
      scriptPubKey: {
        asm:
          'OP_DUP OP_HASH160 f3707320bbb4a28759a78a5ad63a77a2f5d462ec OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a914f3707320bbb4a28759a78a5ad63a77a2f5d462ec88ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: ['bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0']
      }
    }
  ],
  hex:
    '01000000029a1c67eea78c7b8830dd8ed079239994e0df10f19ea83e34eea2bad3168f2fc4000000008b4830450221008052d3b067418d53585fb8f91e1b57cf3c040dc9c07a70f393ed663b3f7502c50220749aa8e09ac922e78cb474c8097873cfb2634108d7acaa7db32a73a35743da974141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2cffffffff0f501c1be6601b0ed29bd579ae5be8e54842d3a3a2172734fc423fff48aca0e4010000008a473044022050d7fe7cdcec81eefa0987b88ddb83274d8e9063d927090dc4c2d1db76c512d302207dc1eea439a627476265ed87f59cc9823fb572ffc2640f0218d7bddc9a621c6e4141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2cffffffff02c029cd02000000001976a9147ab928d0b41194411a2e87a782b688c7cc69ba4688acad1b0800000000001976a914f3707320bbb4a28759a78a5ad63a77a2f5d462ec88ac00000000',
  blockhash: '0000000000000000045e5e52fb4f9746b3d15d3062855fd346aaef3debef4360',
  confirmations: 71465,
  time: 1545564654,
  blocktime: 1545564654
}

const mockNoTxHistory = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qqwfpk04ecf69wuprj9yjys9rla5mk7rj5j8uthqel',
  balance: '0',
  totalReceived: '0',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 0
}

const mockNoSendBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qq78nwj5x97yh6wtlfd27dtlwjuh70vkjc59h8tgtg',
  balance: '0',
  totalReceived: '0',
  totalSent: '0',
  unconfirmedBalance: '600',
  unconfirmedTxs: 1,
  txs: 0,
  txids: [
    'a3b62cd4f4c56ba52139179db14bffd4ab22a2e077f3c62bd5cf0541bfcaf023'
  ]
}

const mockNoSendTx = {
  txid: 'a3b62cd4f4c56ba52139179db14bffd4ab22a2e077f3c62bd5cf0541bfcaf023',
  hash: 'a3b62cd4f4c56ba52139179db14bffd4ab22a2e077f3c62bd5cf0541bfcaf023',
  version: 2,
  size: 226,
  locktime: 0,
  vin: [
    {
      txid: '681cc1d392975a7e78cbd490b8a940d7eb029c554f2cee332e3a7119d77fb189',
      vout: 1,
      scriptSig: {
        asm: '30450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f[ALL|FORKID] 02bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7',
        hex: '4830450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f412102bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7'
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.000006,
      n: 0,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 3c79ba54317c4be9cbfa5aaf357f74b97f3d9696 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143c79ba54317c4be9cbfa5aaf357f74b97f3d969688ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: [
          'bitcoincash:qq78nwj5x97yh6wtlfd27dtlwjuh70vkjc59h8tgtg'
        ]
      }
    },
    {
      value: 0.00003664,
      n: 1,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 58502a73888e0a386fc69b44850af4b2a86ac9a6 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a91458502a73888e0a386fc69b44850af4b2a86ac9a688ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: [
          'bitcoincash:qpv9q2nn3z8q5wr0c6d5fpg27je2s6kf5cavp4ney0'
        ]
      }
    }
  ],
  hex: '020000000189b17fd719713a2e33ee2c4f559c02ebd740a9b890d4cb787e5a9792d3c11c68010000006b4830450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f412102bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7ffffffff0258020000000000001976a9143c79ba54317c4be9cbfa5aaf357f74b97f3d969688ac500e0000000000001976a91458502a73888e0a386fc69b44850af4b2a86ac9a688ac00000000'
}

module.exports = {
  mockBalance,
  mockTxDetails,
  mockNoTxHistory,
  mockNoSendBalance,
  mockNoSendTx
}
