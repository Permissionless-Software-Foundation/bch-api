/*
  Use minimal-slp-wallet and psf-multisig-approval libraries
  to look up the PSFFPP write price.
*/

// Global npm libraries
const SlpWallet = require('minimal-slp-wallet')
// const PSFFPP = require('psffpp')

class WritePrice {
  async getPsffppWritePrice (inObj = {}) {
    const wallet = new SlpWallet(undefined, {
      interface: 'rest-api',
      restURL: 'http://localhost:3000/v5/'
    })
    await wallet.walletInfoPromise

    let PSFFPP = await import('psffpp')
    PSFFPP = PSFFPP.default

    const psffpp = new PSFFPP({ wallet })

    const writePrice = await psffpp.getMcWritePrice()

    return writePrice
  }
}

module.exports = WritePrice
