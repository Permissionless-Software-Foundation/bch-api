const axios = require('axios')

const SLPSDK = require('@psf/bch-js')
const SLP = new SLPSDK()

class Slpdb {
  // Gets transaction history for all tokens for an address. Can also specify
  // block height, but defaults to 0.
  async getHistoricalSlpTransactions (addressList, fromBlock = 0) {
    // Build SLPDB or query from addressList
    const orQueryArray = []
    for (const address of addressList) {
      const cashAddress = SLP.SLP.Address.toCashAddress(address)
      const slpAddress = SLP.SLP.Address.toSLPAddress(address)

      const cashQuery = {
        'in.e.a': cashAddress.slice(12)
      }
      const slpQuery = {
        'slp.detail.outputs.address': slpAddress
      }

      orQueryArray.push(cashQuery)
      orQueryArray.push(slpQuery)
    }

    const query = {
      v: 3,
      q: {
        find: {
          db: ['c', 'u'],
          $query: {
            $or: orQueryArray,
            'slp.valid': true,
            'blk.i': {
              $not: {
                $lte: fromBlock
              }
            }
          },
          $orderby: {
            'blk.i': -1
          }
        },
        project: {
          _id: 0,
          'tx.h': 1,
          'in.i': 1,
          'in.e': 1,
          'out.e': 1,
          'out.a': 1,
          'slp.detail': 1,
          blk: 1
        },
        limit: 500
      }
    }

    const result = await this.runQuery(query)
    // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

    let transactions = []

    // Add confirmed transactions
    if (result.data && result.data.c) {
      transactions = transactions.concat(result.data.c)
    }

    // Add unconfirmed transactions
    if (result.data && result.data.u) {
      transactions = transactions.concat(result.data.u)
    }

    return transactions
  }

  async getTokenStats (tokenId) {
    const [
      totalMinted,
      totalBurned,
      tokenDetails,
      circulatingSupply
    ] = await Promise.all([
      this.getTotalMinted(tokenId),
      this.getTotalBurned(tokenId),
      this.getTokenDetails(tokenId),
      this.getTotalCirculating(tokenId)
    ])

    tokenDetails.totalMinted = tokenDetails.initialTokenQty + totalMinted
    tokenDetails.totalBurned = totalBurned

    // tokenDetails.circulatingSupply =
    //   tokenDetails.totalMinted - tokenDetails.totalBurned
    tokenDetails.circulatingSupply = circulatingSupply

    return tokenDetails
  }

  generateCredentials () {
    // Generate the Basic Authentication header for a private instance of SLPDB.
    const SLPDB_PASS = process.env.SLPDB_PASS
      ? process.env.SLPDB_PASS
      : 'BITBOX'
    const username = 'BITBOX'
    const password = SLPDB_PASS
    const combined = `${username}:${password}`
    const base64Credential = Buffer.from(combined).toString('base64')
    const readyCredential = `Basic ${base64Credential}`

    const options = {
      headers: {
        authorization: readyCredential,
        timeout: 30000
      }
    }

    return options
  }

  async runQuery (query) {
    const queryString = JSON.stringify(query)
    const queryBase64 = Buffer.from(queryString).toString('base64')
    const url = `${process.env.SLPDB_URL}q/${queryBase64}`

    const options = this.generateCredentials()

    const response = await axios.get(url, options)
    return response
  }

  async getTotalMinted (tokenId) {
    const query = {
      v: 3,
      q: {
        db: ['g'],
        aggregate: [
          {
            $match: {
              'tokenDetails.tokenIdHex': tokenId,
              'graphTxn.outputs.status': {
                $in: [
                  'BATON_SPENT_IN_MINT',
                  'BATON_UNSPENT',
                  'BATON_SPENT_NOT_IN_MINT'
                ]
              }
            }
          },
          {
            $unwind: '$graphTxn.outputs'
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: '$graphTxn.outputs.slpAmount'
              }
            }
          }
        ],
        limit: 1
      }
    }

    const result = await this.runQuery(query)

    if (!result.data.g.length) {
      return 0
    }

    return parseFloat(result.data.g[0].count)
  }

  async getTotalCirculating (tokenId) {
    const query = {
      v: 3,
      q: {
        db: ['g'],
        aggregate: [
          {
            $match: {
              'tokenDetails.tokenIdHex': tokenId,
              'graphTxn.outputs': {
                $elemMatch: {
                  status: 'UNSPENT',
                  slpAmount: { $gte: 0 }
                }
              }
            }
          },
          { $unwind: '$graphTxn.outputs' },
          {
            $match: {
              'graphTxn.outputs.status': 'UNSPENT',
              'graphTxn.outputs.slpAmount': { $gte: 0 }
            }
          },
          {
            $group: {
              _id: null,
              circulating_supply: {
                $sum: '$graphTxn.outputs.slpAmount'
              }
            }
          }
        ],
        limit: 100000
      }
    }

    const result = await this.runQuery(query)
    // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

    if (!result.data.g.length) {
      return 0
    }

    return parseFloat(result.data.g[0].circulating_supply)
  }

  async getTotalBurned (tokenId) {
    const query = {
      v: 3,
      q: {
        db: ['g'],
        aggregate: [
          {
            $match: {
              'tokenDetails.tokenIdHex': tokenId,
              'graphTxn.outputs.status': {
                $in: [
                  'SPENT_NON_SLP',
                  'BATON_SPENT_INVALID_SLP',
                  'SPENT_INVALID_SLP',
                  'BATON_SPENT_NON_SLP',
                  'MISSING_BCH_VOUT',
                  'BATON_MISSING_BCH_VOUT',
                  'BATON_SPENT_NOT_IN_MINT',
                  'EXCESS_INPUT_BURNED'
                ]
              }
            }
          },
          {
            $unwind: '$graphTxn.outputs'
          },
          {
            $match: {
              'graphTxn.outputs.status': {
                $in: [
                  'SPENT_NON_SLP',
                  'BATON_SPENT_INVALID_SLP',
                  'SPENT_INVALID_SLP',
                  'BATON_SPENT_NON_SLP',
                  'MISSING_BCH_VOUT',
                  'BATON_MISSING_BCH_VOUT',
                  'BATON_SPENT_NOT_IN_MINT',
                  'EXCESS_INPUT_BURNED'
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: '$graphTxn.outputs.slpAmount'
              }
            }
          }
        ],
        limit: 1
      }
    }

    const result = await this.runQuery(query)

    if (!result.data.g.length) {
      return 0
    }

    return parseFloat(result.data.g[0].count)
  }

  async getTokenDetails (tokenId) {
    const query = {
      v: 3,
      q: {
        db: ['t'],
        find: {
          $query: {
            'tokenDetails.tokenIdHex': tokenId
          }
        },
        project: { tokenDetails: 1, tokenStats: 1, _id: 0 },
        limit: 1
      }
    }

    const result = await this.runQuery(query)

    if (!result.data.t.length) {
      throw new Error('Token could not be found')
    }

    const token = this.formatTokenOutput(result.data.t[0])

    return token
  }

  formatTokenOutput (token) {
    // console.log(`token: ${JSON.stringify(token, null, 2)}`)

    token.tokenDetails.id = token.tokenDetails.tokenIdHex
    delete token.tokenDetails.tokenIdHex
    token.tokenDetails.documentHash = token.tokenDetails.documentSha256Hex
    delete token.tokenDetails.documentSha256Hex
    token.tokenDetails.initialTokenQty = parseFloat(
      token.tokenDetails.genesisOrMintQuantity
    )
    delete token.tokenDetails.genesisOrMintQuantity
    delete token.tokenDetails.transactionType
    delete token.tokenDetails.batonVout
    delete token.tokenDetails.sendOutputs

    token.tokenDetails.blockCreated = token.tokenStats.block_created
    token.tokenDetails.blockLastActiveSend =
      token.tokenStats.block_last_active_send
    token.tokenDetails.blockLastActiveMint =
      token.tokenStats.block_last_active_mint
    token.tokenDetails.txnsSinceGenesis =
      token.tokenStats.qty_valid_txns_since_genesis
    token.tokenDetails.validAddresses =
      token.tokenStats.qty_valid_token_addresses
    token.tokenDetails.mintingBatonStatus =
      token.tokenStats.minting_baton_status

    delete token.tokenStats.block_last_active_send
    delete token.tokenStats.block_last_active_mint
    delete token.tokenStats.qty_valid_txns_since_genesis
    delete token.tokenStats.qty_valid_token_addresses

    token.tokenDetails.timestampUnix = token.tokenDetails.timestamp_unix
    delete token.tokenDetails.timestamp_unix

    return token.tokenDetails
  }
}

module.exports = Slpdb
