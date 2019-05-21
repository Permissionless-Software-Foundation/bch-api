"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const config = {
  addressRateLimit1: undefined,
  addressRateLimit2: undefined,
  addressRateLimit3: undefined,
  addressRateLimit4: undefined
}

let i = 1
while (i < 6) {
  config[`addressRateLimit${i}`] = new RateLimit({
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

router.get("/", config.addressRateLimit1, async (req, res, next) => {
  res.json({ status: "address" })
})

router.get(
  "/details/:address",
  config.addressRateLimit2,
  async (req, res, next) => {
    try {
      let addresses = JSON.parse(req.params.address)

      // Enforce no more than 20 addresses.
      if (addresses.length > 20) {
        res.json({
          error: "Array too large. Max 20 addresses"
        })
      }

      const result = []
      addresses = addresses.map(address => {
        const path = `${
          process.env.BITCOINCOM_BASEURL
        }addr/${BITBOX.Address.toLegacyAddress(address)}`
        return axios.get(path) // Returns a promise.
      })

      axios.all(addresses).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data
            parsed.legacyAddress = BITBOX.Address.toLegacyAddress(
              parsed.addrStr
            )
            parsed.cashAddress = BITBOX.Address.toCashAddress(parsed.addrStr)
            delete parsed.addrStr
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      let path = `${
        process.env.BITCOINCOM_BASEURL
      }addr/${BITBOX.Address.toLegacyAddress(req.params.address)}`
      if (req.query.from && req.query.to)
        path = `${path}?from=${req.query.from}&to=${req.query.to}`

      axios
        .get(path)
        .then(response => {
          const parsed = response.data
          delete parsed.addrStr
          parsed.legacyAddress = BITBOX.Address.toLegacyAddress(
            req.params.address
          )
          parsed.cashAddress = BITBOX.Address.toCashAddress(req.params.address)
          res.json(parsed)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/utxo/:address",
  config.addressRateLimit3,
  async (req, res, next) => {
    try {
      let addresses = JSON.parse(req.params.address)
      if (addresses.length > 20) {
        res.json({
          error: "Array too large. Max 20 addresses"
        })
      }

      addresses = addresses.map(address =>
        BITBOX.Address.toLegacyAddress(address)
      )
      const final = []
      addresses.forEach(address => {
        final.push([])
      })
      axios
        .get(`${process.env.BITCOINCOM_BASEURL}addrs/${addresses}/utxo`)
        .then(response => {
          const parsed = response.data
          parsed.forEach(data => {
            data.legacyAddress = BITBOX.Address.toLegacyAddress(data.address)
            data.cashAddress = BITBOX.Address.toCashAddress(data.address)
            delete data.address
            addresses.forEach((address, index) => {
              if (addresses[index] === data.legacyAddress)
                final[index].push(data)
            })
          })
          res.json(final)
        })
        .catch(error => {
          //res.send(error.response.data.error.message)
          // console.log(`Error: `, error)
        })
    } catch (error) {
      axios
        .get(
          `${
            process.env.BITCOINCOM_BASEURL
          }addr/${BITBOX.Address.toLegacyAddress(req.params.address)}/utxo`
        )
        .then(response => {
          const parsed = response.data
          parsed.forEach(data => {
            delete data.address
            data.legacyAddress = BITBOX.Address.toLegacyAddress(
              req.params.address
            )
            data.cashAddress = BITBOX.Address.toCashAddress(req.params.address)
          })
          res.json(parsed)
        })
        .catch(error => {
          //res.send(error.response.data.error.message)
          // console.log(`Error: `, error)
        })
    }
  }
)

router.get(
  "/unconfirmed/:address",
  config.addressRateLimit4,
  (req, res, next) => {
    try {
      let addresses = JSON.parse(req.params.address)
      if (addresses.length > 20) {
        res.json({
          error: "Array too large. Max 20 addresses"
        })
      }
      addresses = addresses.map(address =>
        BITBOX.Address.toLegacyAddress(address)
      )
      const final = []
      addresses.forEach(address => {
        final.push([])
      })
      axios
        .get(`${process.env.BITCOINCOM_BASEURL}addrs/${addresses}/utxo`)
        .then(response => {
          const parsed = response.data
          parsed.forEach(data => {
            data.legacyAddress = BITBOX.Address.toLegacyAddress(data.address)
            data.cashAddress = BITBOX.Address.toCashAddress(data.address)
            delete data.address
            if (data.confirmations === 0) {
              addresses.forEach((address, index) => {
                if (addresses[index] === data.legacyAddress)
                  final[index].push(data)
              })
            }
          })
          res.json(final)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    } catch (error) {
      axios
        .get(
          `${
            process.env.BITCOINCOM_BASEURL
          }addr/${BITBOX.Address.toLegacyAddress(req.params.address)}/utxo`
        )
        .then(response => {
          const parsed = response.data
          const unconfirmed = []
          parsed.forEach(data => {
            data.legacyAddress = BITBOX.Address.toLegacyAddress(data.address)
            data.cashAddress = BITBOX.Address.toCashAddress(data.address)
            delete data.address
            if (data.confirmations === 0) unconfirmed.push(data)
          })
          res.json(unconfirmed)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/unconfirmed/:address",
  config.addressRateLimit4,
  async (req, res, next) => {
    try {
      let addresses = JSON.parse(req.params.address)
      if (addresses.length > 20) {
        res.json({
          error: "Array too large. Max 20 addresses"
        })
      }
      addresses = addresses.map(address =>
        BITBOX.Address.toLegacyAddress(address)
      )
      const final = []
      addresses.forEach(address => {
        final.push([])
      })
      axios
        .get(`${process.env.BITCOINCOM_BASEURL}txs/?address=${addresses}`)
        .then(response => {
          res.json(response.data)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    } catch (error) {
      axios
        .get(
          `${
            process.env.BITCOINCOM_BASEURL
          }txs/?address=${BITBOX.Address.toLegacyAddress(req.params.address)}`
        )
        .then(response => {
          res.json(response.data)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/transactions/:address",
  config.addressRateLimit5,
  (req, res, next) => {
    try {
      let addresses = JSON.parse(req.params.address)
      if (addresses.length > 20) {
        res.json({
          error: "Array too large. Max 20 addresses"
        })
      }
      addresses = addresses.map(address =>
        BITBOX.Address.toLegacyAddress(address)
      )
      const final = []
      addresses.forEach(address => {
        final.push([])
      })
      axios
        .get(`${process.env.BITCOINCOM_BASEURL}txs/?address=${addresses}`)
        .then(response => {
          res.json(response.data)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    } catch (error) {
      axios
        .get(
          `${
            process.env.BITCOINCOM_BASEURL
          }txs/?address=${BITBOX.Address.toLegacyAddress(req.params.address)}`
        )
        .then(response => {
          res.json(response.data)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

module.exports = router
