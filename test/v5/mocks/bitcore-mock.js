/*
  This library contains mocking data for running unit tests on the bitcore route.
*/

'use strict'

const mockBalance = {
  confirmed: 10000000,
  unconfirmed: 0,
  balance: 10000000
}

const mockUtxos = [
  {
    _id: '5cf2c31a33bd46a95ec7e730',
    chain: 'BCH',
    network: 'testnet',
    coinbase: false,
    mintIndex: 1,
    spentTxid: '',
    mintTxid:
      '5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392',
    mintHeight: 1265275,
    spentHeight: -2,
    address: 'qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4',
    script: '76a9140e5b4ad9008bb9a027b7e2d0ef958914e12db20788ac',
    value: 10000000,
    confirmations: -1
  }
]

module.exports = {
  mockBalance,
  mockUtxos
}
