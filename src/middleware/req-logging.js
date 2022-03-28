/*
  This middleware logs connection information to local logs. It gives the ability
  to detect when the server is being DDOS attacked, and also to collect metrics,
  like the most popular endpoints.
*/

// const express = require('express')
const wlogger = require('../util/winston-logging')

// Used for debugging and iterrogating JS objects.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const logReqInfo = function (req, res, next) {
  try {
    /*
    // console.log(`req: ${util.inspect(req)}`)
    console.log(`req.headers: ${util.inspect(req.headers)}`)
    console.log(`req.url: ${req.url}`)
    console.log(`req.method: ${req.method}`)
    // console.log(`req.sws.ip: ${req.sws.ip}`)
    // console.log(`req.sws.real_ip: ${req.sws.real_ip}`)
    console.log(`req.body: ${util.inspect(req.body)}`)
    console.log(`req.connection.remoteAddress: ${util.inspect(req.connection.remoteAddress)}`)
    // console.log(`req: `, req)
    console.log(` `)
    console.log(` `)
    */

    // const ip = req.sws.real_ip
    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress
    const method = req.method
    const url = req.url

    const dataToLog = {
      headers: req.headers,
      url: url,
      method: method,
      ip: ip,
      body: req.body
    }

    wlogger.info(`Request: ${ip} ${method} ${url}`, dataToLog)

    next()
  } catch (err) {
    console.error('Error in req-logging.js middleware: ', err)
    next()
  }
}

module.exports = logReqInfo
