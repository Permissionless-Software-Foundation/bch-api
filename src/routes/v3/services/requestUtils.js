"use strict"

const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const getRequestConfig = (method, params) => ({
  method: "post",
  auth: {
    username,
    password
  },
  data: {
    jsonrpc: "1.0",
    id: method,
    method,
    params
  }
})

module.exports = getRequestConfig
