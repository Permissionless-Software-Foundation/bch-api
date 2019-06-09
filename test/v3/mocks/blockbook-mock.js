/*
  This library contains mocking data for running unit tests on the blockbook route.
*/

"use strict"

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: "bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4",
  balance: "10000000",
  totalReceived: "10000000",
  totalSent: "0",
  unconfirmedBalance: "0",
  unconfirmedTxs: 0,
  txs: 1,
  txids: ["5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392"]
}

const mockUtxos = [
  {
    txid: "5fe9b74056319a8c87f45cc745030715a6180758b94938dbf90d639d55652392",
    vout: 1,
    value: "10000000",
    height: 1265275,
    confirmations: 42704
  }
]

module.exports = {
  mockBalance,
  mockUtxos
}
