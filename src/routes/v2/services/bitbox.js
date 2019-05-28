"use strict"

const axios = require("axios")

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})

const getInstance = () => BitboxHTTP

module.exports = getInstance
