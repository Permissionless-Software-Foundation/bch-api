/*
  Config settings for working with an ElectrumX or Fulcrum server.
*/

const config = {
  port: 8000,
  electrum: {
    application: 'bch-api',
    version: '1.4.1',
    confidence: 2,
    distribution: 3,
    // servers: [
    //   'fulcrum.fountainhead.cash:50002',
    //   'electrum.imaginary.cash:50002',
    //   'bch.imaginary.cash:50002',
    //   'electroncash.de:50002',
    //   'electroncash.dk:50002',
    //   'electron.jochen-hoenicke.de:51002'
    // ]
    serverUrl: 'fulcrum.fountainhead.cash',
    // serverUrl: 'badurl.com',
    serverPort: '50002'
  },
  ratelimit: {
    windowMs: 1 * 60 * 1000,
    max: 100
  }
}

module.exports = config
