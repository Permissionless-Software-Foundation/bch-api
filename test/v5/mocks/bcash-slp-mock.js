/*
  This library contains mocking data for running unit tests on the bcash route.
*/

const tokenInfo = {
  tokenId: 'c7cb019764df3a352d9433749330b4b2eb022d8fbc101e68a6943a7a58a8ee84',
  ticker: 'PSI',
  name: 'Psidium',
  uri: '',
  hash: '',
  decimals: 8
}

const utxos = [
  {
    version: 2,
    height: 707135,
    value: 546,
    script: '76a91466b2156f71629c89f5bf882cb3920b0e1e4d4fa888ac',
    address: 'bitcoincash:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk',
    coinbase: false,
    hash: '77e514d59c0c866e791d08ddab73a1f7827be5f1ca15c1e05515dac9b271b596',
    index: 2,
    slp: {
      vout: 2,
      tokenId:
        '5f2914840d0fd82689bdf0a0f8194ea363b9d0e2bd69b01608e18e1c6a4b9861',
      value: '9999777700000',
      type: 'SEND'
    }
  },
  {
    version: 2,
    height: 707135,
    value: 546,
    script: '76a91466b2156f71629c89f5bf882cb3920b0e1e4d4fa888ac',
    address: 'bitcoincash:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk',
    coinbase: false,
    hash: '350aab06bf9523c062692f62622cb28b18cff9e4aa92be5476143336da217e98',
    index: 1,
    slp: {
      vout: 1,
      tokenId:
        '2d860662801067828be3c4f504ce31b2a1a36c2cdbc6d92f6160920f66b0a9ee',
      value: '1',
      type: 'SEND'
    }
  },
  {
    version: 2,
    height: 687335,
    value: 546,
    script: '76a91466b2156f71629c89f5bf882cb3920b0e1e4d4fa888ac',
    address: 'bitcoincash:qpnty9t0w93fez04h7yzevujpv8pun204qv6yfuahk',
    coinbase: false,
    hash: 'b7a0f52a344b1169292c757a36c62dbdaaa4ad684e96837eec732a9a2033dfd1',
    index: 1,
    slp: {
      vout: 1,
      tokenId:
        'c7cb019764df3a352d9433749330b4b2eb022d8fbc101e68a6943a7a58a8ee84',
      value: '100000000',
      type: 'SEND'
    }
  }
]

module.exports = {
  tokenInfo,
  utxos
}
