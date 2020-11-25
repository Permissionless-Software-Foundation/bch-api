/*
  A utility library that allows bch-api to easily switch from a local or default
  installation of Blockbook to the public Blockbook cloud service offered by
  OpenBazaar. This will be expanded to other Blockbook indexer services.

  CT 9/29/19 - Switching to OpenBazaar does not work because the integration tests
  use testnet and I don't think OpenBazaar has a testnet version of their BCH
  Blockbook.
*/

'use strict'

class BlockbookPath {
  constructor() {
    // defaults
    this.addrPath = `${process.env.BLOCKBOOK_URL}api/v2/address/`
    this.utxoPath = `${process.env.BLOCKBOOK_URL}api/v2/utxo/`
    this.txPath = `${process.env.BLOCKBOOK_URL}api/v2/tx/`
  }

  toOpenBazaar() {
    if (process.env.NETWORK === 'testnet') {
      this.addrPath = 'https://tbch.blockbook.api.openbazaar.org/api/address/'
      this.utxoPath = 'https://tbch.blockbook.api.openbazaar.org/api/utxo/'
      this.txPath = 'https://tbch.blockbook.api.openbazaar.org/api/tx/'
    } else {
      this.addrPath = 'https://bch.blockbook.api.openbazaar.org/api/address/'
      this.utxoPath = 'https://bch.blockbook.api.openbazaar.org/api/utxo/'
      this.txPath = 'https://bch.blockbook.api.openbazaar.org/api/tx/'
    }
  }

  toDefault() {
    this.addrPath = `${process.env.BLOCKBOOK_URL}api/v2/address/`
    this.utxoPath = `${process.env.BLOCKBOOK_URL}api/v2/utxo/`
    this.txPath = `${process.env.BLOCKBOOK_URL}api/v2/tx/`
  }
}

module.exports = BlockbookPath
