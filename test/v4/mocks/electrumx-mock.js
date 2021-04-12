/*
  Mocking data for electrumx unit tests
*/

'use strict'

const utxos = [
  {
    height: 604392,
    tx_hash: '7774e449c5a3065144cefbc4c0c21e6b69c987f095856778ef9f45ddd8ae1a41',
    tx_pos: 0,
    value: 1000
  },
  {
    height: 630834,
    tx_hash: '4fe60a51e0d8f5134bfd8e5f872d6e502d7f01b28a6afebb27f4438a4f638d53',
    tx_pos: 0,
    value: 6000
  }
]

const balance = {
  confirmed: 7000,
  unconfirmed: 0
}

const txHistory = [
  {
    height: 601861,
    tx_hash: '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d'
  }
]

const mempool = [
  {
    tx_hash: '45381031132c57b2ff1cbe8d8d3920cf9ed25efd9a0beb764bdb2f24c7d1c7e3',
    height: 0,
    fee: 24310
  }
]

const txDetails = {
  blockhash: '0000000000000000002aaf94953da3b487317508ebd1003a1d75d6d6ec2e75cc',
  blocktime: 1578327094,
  confirmations: 31861,
  hash: '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251',
  hex: '020000000265d13ef402840c8a51f39779afb7ae4d49e4b0a3c24a3d0e7742038f2c679667010000006441dd1dd72770cadede1a7fd0363574846c48468a398ddfa41a9677c74cac8d2652b682743725a3b08c6c2021a629011e11a264d9036e9d5311e35b5f4937ca7b4e4121020797d8fd4d2fa6fd7cdeabe2526bfea2b90525d6e8ad506ec4ee3c53885aa309ffffffff65d13ef402840c8a51f39779afb7ae4d49e4b0a3c24a3d0e7742038f2c679667000000006441347d7f218c11c04487c1ad8baac28928fb10e5054cd4494b94d078cfa04ccf68e064fb188127ff656c0b98e9ce87f036d183925d0d0860605877d61e90375f774121028a53f95eb631b460854fc836b2e5d31cad16364b4dc3d970babfbdcc3f2e4954ffffffff035ac355000000000017a914189ce02e332548f4804bac65cba68202c9dbf822878dfd0800000000001976a914285bb350881b21ac89724c6fb6dc914d096cd53b88acf9ef3100000000001976a91445f1f1c4a9b9419a5088a3e9c24a293d7a150e6488ac00000000',
  locktime: 0,
  size: 392,
  time: 1578327094,
  txid: '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251',
  version: 2,
  vin: [
    {
      scriptSig: {
        asm: 'dd1dd72770cadede1a7fd0363574846c48468a398ddfa41a9677c74cac8d2652b682743725a3b08c6c2021a629011e11a264d9036e9d5311e35b5f4937ca7b4e[ALL|FORKID] 020797d8fd4d2fa6fd7cdeabe2526bfea2b90525d6e8ad506ec4ee3c53885aa309',
        hex: '41dd1dd72770cadede1a7fd0363574846c48468a398ddfa41a9677c74cac8d2652b682743725a3b08c6c2021a629011e11a264d9036e9d5311e35b5f4937ca7b4e4121020797d8fd4d2fa6fd7cdeabe2526bfea2b90525d6e8ad506ec4ee3c53885aa309'
      },
      sequence: 4294967295,
      txid: '6796672c8f0342770e3d4ac2a3b0e4494daeb7af7997f3518a0c8402f43ed165',
      vout: 1
    },
    {
      scriptSig: {
        asm: '347d7f218c11c04487c1ad8baac28928fb10e5054cd4494b94d078cfa04ccf68e064fb188127ff656c0b98e9ce87f036d183925d0d0860605877d61e90375f77[ALL|FORKID] 028a53f95eb631b460854fc836b2e5d31cad16364b4dc3d970babfbdcc3f2e4954',
        hex: '41347d7f218c11c04487c1ad8baac28928fb10e5054cd4494b94d078cfa04ccf68e064fb188127ff656c0b98e9ce87f036d183925d0d0860605877d61e90375f774121028a53f95eb631b460854fc836b2e5d31cad16364b4dc3d970babfbdcc3f2e4954'
      },
      sequence: 4294967295,
      txid: '6796672c8f0342770e3d4ac2a3b0e4494daeb7af7997f3518a0c8402f43ed165',
      vout: 0
    }
  ],
  vout: [
    {
      n: 0,
      scriptPubKey: {
        addresses: ['bitcoincash: pqvfecpwxvj53ayqfwkxtjaxsgpvnklcyg8xewk9hl'],
        asm: 'OP_HASH160 189ce02e332548f4804bac65cba68202c9dbf822 OP_EQUAL',
        hex: 'a914189ce02e332548f4804bac65cba68202c9dbf82287',
        reqSigs: 1,
        type: 'scripthash'
      },
      value: 0.0562057
    },
    {
      n: 1,
      scriptPubKey: {
        addresses: ['bitcoincash: qq59hv6s3qdjrtyfwfxxldkuj9xsjmx48vrz882knz'],
        asm: 'OP_DUP OP_HASH160 285bb350881b21ac89724c6fb6dc914d096cd53b OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a914285bb350881b21ac89724c6fb6dc914d096cd53b88ac',
        reqSigs: 1,
        type: 'pubkeyhash'
      },
      value: 0.00589197
    },
    {
      n: 2,
      scriptPubKey: {
        addresses: ['bitcoincash: qpzlruwy4xu5rxjs3z37nsj29y7h59gwvsu4ddp0u4'],
        asm: 'OP_DUP OP_HASH160 45f1f1c4a9b9419a5088a3e9c24a293d7a150e64 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a91445f1f1c4a9b9419a5088a3e9c24a293d7a150e6488ac',
        reqSigs: 1,
        type: 'pubkeyhash'
      },
      value: 0.03272697
    }
  ]
}

const blockHeaders = [
  '010000008b52bbd72c2f49569059f559c1b1794de5192e4f7d6d2b03c7482bad0000000083e4f8a9d502ed0c419075c1abb5d56f878a2e9079e5612bfb76a2dc37d9c42741dd6849ffff001d2b909dd6',
  '01000000f528fac1bcb685d0cd6c792320af0300a5ce15d687c7149548904e31000000004e8985a786d864f21e9cbb7cbdf4bc9265fe681b7a0893ac55a8e919ce035c2f85de6849ffff001d385ccb7c'
]

module.exports = {
  utxos,
  balance,
  txHistory,
  mempool,
  txDetails,
  blockHeaders
}
