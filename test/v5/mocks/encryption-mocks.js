/*
  Mock data for the encryption test library
*/

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
        asm:
          '30450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f[ALL|FORKID] 02bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7',
        hex:
          '4830450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f412102bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7'
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.000006,
      n: 0,
      scriptPubKey: {
        asm:
          'OP_DUP OP_HASH160 3c79ba54317c4be9cbfa5aaf357f74b97f3d9696 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143c79ba54317c4be9cbfa5aaf357f74b97f3d969688ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: ['bitcoincash:qq78nwj5x97yh6wtlfd27dtlwjuh70vkjc59h8tgtg']
      }
    },
    {
      value: 0.00003664,
      n: 1,
      scriptPubKey: {
        asm:
          'OP_DUP OP_HASH160 58502a73888e0a386fc69b44850af4b2a86ac9a6 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a91458502a73888e0a386fc69b44850af4b2a86ac9a688ac',
        reqSigs: 1,
        type: 'pubkeyhash',
        addresses: ['bitcoincash:qpv9q2nn3z8q5wr0c6d5fpg27je2s6kf5cavp4ney0']
      }
    }
  ],
  hex:
    '020000000189b17fd719713a2e33ee2c4f559c02ebd740a9b890d4cb787e5a9792d3c11c68010000006b4830450221008a7c86ce3a9f5765573440143a00631bb5afa9a58b24674a7fa794bb11ffffc30220397dd4c672c3e0dbe0c4eb6390b5727c5fdc3a42cf3ae275ac13b44d27bb234f412102bc9fc26ae2bd9a9a14e9baeda4b4fdd95a00bcbf375732c647488b3ce82a2fd7ffffffff0258020000000000001976a9143c79ba54317c4be9cbfa5aaf357f74b97f3d969688ac500e0000000000001976a91458502a73888e0a386fc69b44850af4b2a86ac9a688ac00000000'
}

const mockFulcrumTxHistory = {
  success: true,
  transactions: [
    {
      transactions: [
        {
          height: 511463,
          tx_hash:
            'eff00a9538487ff44243c75fb13de19b5783454c42c81b9aff9afbfd09cbaec3'
        },
        {
          height: 511464,
          tx_hash:
            '7e9aa7a74de2b30200a2d6fc748ff35a0c753221444194f720bb7f61ef1d9153'
        },
        {
          height: 513373,
          tx_hash:
            '6960255abe64893073921e96bf3c053c82686e0fc22a565494fbe2a31e766975'
        },
        {
          height: 513373,
          tx_hash:
            '9ea667bcfc9cd337bd6c5583d8094c1b1942bd2015d95b54189deac5070eeff0'
        },
        {
          height: 560481,
          tx_hash:
            'ecc1b51bac767880382bf3190ff17abf78d0936843a022a943d871116ed50368'
        },
        {
          height: 560615,
          tx_hash:
            'b3792d28377b975560e1b6f09e48aeff8438d4c6969ca578bd406393bd50bd7d'
        },
        {
          height: 561568,
          tx_hash:
            '8bc2134c7e48e56e1769b3d7c4c1e3a0acc68e1e58160eee6fa67f3208c07262'
        },
        {
          height: 561569,
          tx_hash:
            'ceb0cab0e37b59caf3ca29e1a698d19ff47f2827dd09cb2f3b91b9100b1dad1c'
        },
        {
          height: 561572,
          tx_hash:
            '0f9b49cafeb9ae1d741cdb12137c92816aa8470944c270a78ba2e610bd59190d'
        },
        {
          height: 561582,
          tx_hash:
            'e4a0ac48ff3f42fc342717a2a3d34248e5e85bae79d59bd20e1b60e61b1c500f'
        },
        {
          height: 562106,
          tx_hash:
            '1afcc63b244182647909539ebe3f4a44b8ea4120a95edb8d9eebe5347b9491bb'
        },
        {
          height: 562106,
          tx_hash:
            'c42f8f16d3baa2ee343ea89ef110dfe094992379d08edd30887b8ca7ee671c9a'
        }
      ]
    }
  ]
}

const mockTxDetails2 = {
  txid: '7e9aa7a74de2b30200a2d6fc748ff35a0c753221444194f720bb7f61ef1d9153',
  hash: '7e9aa7a74de2b30200a2d6fc748ff35a0c753221444194f720bb7f61ef1d9153',
  version: 1,
  size: 221,
  locktime: 0,
  vin: [
    {
      txid: 'eff00a9538487ff44243c75fb13de19b5783454c42c81b9aff9afbfd09cbaec3',
      vout: 0,
      scriptSig: {
        asm:
          '30440220150e7c9b646fe1f7f576456c9808c89a710e8fbb753e9f5ca6ed2d39a0b69ba602202212968163d8dfe35eec5975fce38440082029cb2691a3e0ad1714f9c412c47a[ALL|FORKID] 044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c',
        hex:
          '4730440220150e7c9b646fe1f7f576456c9808c89a710e8fbb753e9f5ca6ed2d39a0b69ba602202212968163d8dfe35eec5975fce38440082029cb2691a3e0ad1714f9c412c47a4141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2c'
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.01266023,
      n: 0,
      scriptPubKey: {
        asm: 'OP_HASH160 91bacd6785e3f8c78d5f29b4020b94c753444130 OP_EQUAL',
        hex: 'a91491bacd6785e3f8c78d5f29b4020b94c75344413087',
        reqSigs: 1,
        type: 'scripthash',
        addresses: ['bitcoincash:pzgm4nt8sh3l33udtu5mgqstjnr4x3zpxqrrrndnw5']
      }
    }
  ],
  hex:
    '0100000001c3aecb09fdfb9aff9a1bc8424c4583579be13db15fc74342f47f4838950af0ef000000008a4730440220150e7c9b646fe1f7f576456c9808c89a710e8fbb753e9f5ca6ed2d39a0b69ba602202212968163d8dfe35eec5975fce38440082029cb2691a3e0ad1714f9c412c47a4141044eb40b025df18409f2a5197b010dd62a9e65d9a74e415e5b10367721a9c4baa7ebfee22d14b8ece1c9bd70c0d9e5e8b00b61b81b88a1b5ce6f24eac6b8a34b2cffffffff01675113000000000017a91491bacd6785e3f8c78d5f29b4020b94c7534441308700000000',
  blockhash: '000000000000000001aab6818b4ad0379a3f7a13940d9b3d4838b3dea1d0a083',
  confirmations: 149222,
  time: 1515088493,
  blocktime: 1515088493
}

const mockFulcrumNoTxHistory = {
  success: true,
  transactions: [
    {
      transactions: [],
      address: 'bitcoincash:qrgqqkky28jdkv3w0ctrah0mz3jcsnsklc34gtukrh'
    }
  ]
}

const mockFulcrumNoSendBalance = {
  success: true,
  transactions: [
    {
      transactions: [
        {
          height: 633578,
          tx_hash:
            'a3b62cd4f4c56ba52139179db14bffd4ab22a2e077f3c62bd5cf0541bfcaf023'
        }
      ]
    }
  ]
}

module.exports = {
  mockNoSendTx,
  mockFulcrumTxHistory,
  mockTxDetails2,
  mockFulcrumNoTxHistory,
  mockFulcrumNoSendBalance
}
