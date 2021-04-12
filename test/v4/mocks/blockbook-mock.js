/*
  This library contains mocking data for running unit tests on the blockbook route.
*/

'use strict'

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
  balance: '10000000',
  totalReceived: '10000000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392']
}

const mockUtxos = [
  {
    txid: '5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392',
    vout: 1,
    value: '10000000',
    height: 1265275,
    confirmations: 42704
  }
]

const mockTx = {
  txid: '5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392',
  version: 2,
  vin: [
    {
      txid: '85ddb8215fc3701a493cf1c450644c5ef32c55aaa2f48ae2d008944394f3e4d3',
      sequence: 4294967295,
      n: 0,
      addresses: ['bchtest:qqmd9unmhkpx4pkmr6fkrr8rm6y77vckjvqe8aey35'],
      value: '16983000648',
      hex:
        '47304402202378e55f4d02bb932498deef22dfc1f7a4984858c3b55017e225dd567172252e0220373d27710b5d42a72ac9725959f1605a912fee0ae86a7ad36e7d6d796f14ca29412103c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792'
    }
  ],
  vout: [
    {
      value: '16973000422',
      n: 0,
      spent: true,
      hex: '76a91436d2f27bbd826a86db1e93618ce3de89ef33169388ac',
      addresses: ['bchtest:qqmd9unmhkpx4pkmr6fkrr8rm6y77vckjvqe8aey35']
    },
    {
      value: '10000000',
      n: 1,
      hex: '76a9140e5b4ad9008bb9a027b7e2d0ef958914e12db20788ac',
      addresses: ['bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4']
    }
  ],
  blockHash: '00000000005242edac4635ac2375a454e801cc1be8b131b622328089731e5e30',
  blockHeight: 1265275,
  confirmations: 65402,
  blockTime: 1540912733,
  value: '16983000422',
  valueIn: '16983000648',
  fees: '226',
  hex:
    '0200000001d3e4f394439408d0e28af4a2aa552cf35e4c6450c4f13c491a70c35f21b8dd85000000006a47304402202378e55f4d02bb932498deef22dfc1f7a4984858c3b55017e225dd567172252e0220373d27710b5d42a72ac9725959f1605a912fee0ae86a7ad36e7d6d796f14ca29412103c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792ffffffff02e66eabf3030000001976a91436d2f27bbd826a86db1e93618ce3de89ef33169388ac80969800000000001976a9140e5b4ad9008bb9a027b7e2d0ef958914e12db20788ac00000000'
}

module.exports = {
  mockBalance,
  mockUtxos,
  mockTx
}
