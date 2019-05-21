"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")
const bitdbToken = process.env.BITDB_TOKEN
const bitboxproxy = require("slpjs").bitbox
const utils = require("slpjs").utils

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

const config = {
  slpRateLimit1: undefined,
  slpRateLimit2: undefined,
  slpRateLimit3: undefined,
  slpRateLimit4: undefined,
  slpRateLimit5: undefined,
  slpRateLimit6: undefined,
  slpRateLimit7: undefined
}

let i = 1
while (i < 8) {
  config[`slpRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: function(req, res /*next*/) {
      res.format({
        json: function() {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

router.get("/", config.slpRateLimit1, async (req, res, next) => {
  res.json({ status: "slp" })
})

router.get("/list", config.slpRateLimit2, async (req, res, next) => {
  try {
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `https://bitdb.network/q/${b64}`
    const header = {
      headers: { key: bitdbToken }
    }

    const tokenRes = await axios.get(url, header)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length) tokens.concat(tokenRes.u)
    res.json(tokens.reverse())

    return tokens
  } catch (err) {
    res.status(500).send(err.response.data.error)
  }
})

router.get("/list/:tokenId", config.slpRateLimit3, async (req, res, next) => {
  try {
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `https://bitdb.network/q/${b64}`
    const header = {
      headers: { key: bitdbToken }
    }

    const tokenRes = await axios.get(url, header)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length) tokens.concat(tokenRes.u)

    tokens.forEach(token => {
      if (token.id === req.params.tokenId) return res.json(token)
    })
  } catch (err) {
    res.status(500).send(err.response.data.error)
  }
})

router.get(
  "/balancesForAddress/:address",
  config.slpRateLimit4,
  async (req, res, next) => {
    try {
      const slpAddr = utils.toSlpAddress(req.params.address)
      const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
      balances.slpAddress = slpAddr
      balances.cashAddress = utils.toCashAddress(slpAddr)
      balances.legacyAddress = BITBOX.Address.toLegacyAddress(
        balances.cashAddress
      )
      return res.json(balances)
    } catch (err) {
      res.status(500).send(err.response.data.error)
    }
  }
)

router.get(
  "/balance/:address/:tokenId",
  config.slpRateLimit5,
  async (req, res, next) => {
    try {
      const slpAddr = utils.toSlpAddress(req.params.address)
      const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
      const query = {
        v: 3,
        q: {
          find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
          limit: 1000
        },
        r: {
          f:
            '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
        }
      }

      const s = JSON.stringify(query)
      const b64 = Buffer.from(s).toString("base64")
      const url = `https://bitdb.network/q/${b64}`
      const header = {
        headers: { key: bitdbToken }
      }

      const tokenRes = await axios.get(url, header)
      const tokens = tokenRes.data.c
      if (tokenRes.data.u && tokenRes.data.u.length) tokens.concat(tokenRes.u)

      let t
      tokens.forEach(token => {
        if (token.id === req.params.tokenId) t = token
      })

      const obj = {}
      obj.id = t.id
      obj.timestamp = t.timestamp
      obj.symbol = t.symbol
      obj.name = t.name
      obj.document = t.document
      obj.balance = balances[req.params.tokenId]
      obj.slpAddress = slpAddr
      obj.cashAddress = utils.toCashAddress(slpAddr)
      obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
      return res.json(obj)
    } catch (err) {
      res.status(500).send(err.response.data.error)
    }
  }
)

router.get(
  "/address/convert/:address",
  config.slpRateLimit6,
  async (req, res, next) => {
    try {
      const slpAddr = utils.toSlpAddress(req.params.address)
      const obj = {}
      obj.slpAddress = slpAddr
      obj.cashAddress = utils.toCashAddress(slpAddr)
      obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
      return res.json(obj)
    } catch (err) {
      res.status(500).send(err.response.data.error)
    }
  }
)

router.get(
  "/balancesForToken/:tokenId",
  config.slpRateLimit7,
  async (req, res, next) => {
    try {
      const balances = "use v2"
      return res.json(balances)
    } catch (err) {
      res.status(500).send(err.response.data.error)
    }
  }
)

module.exports = router
