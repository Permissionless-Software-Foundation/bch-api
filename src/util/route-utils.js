/*
  A private library of utility functions used by several different routes.
*/

'use strict'

const axios = require('axios')
const wlogger = require('./winston-logging')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

// let _this

class RouteUtils {
  constructor () {
    // _this = this

    this.bchjs = bchjs
    this.axios = axios
  }

  // This function expects the Request Express.js object and an array as input.
  // The array is then validated against freemium and pro-tier rate limiting
  // requirements. A boolean is returned to indicate if the array size if valid
  // or not.
  validateArraySize (req, array) {
    const FREEMIUM_INPUT_SIZE = 20
    const PRO_INPUT_SIZE = 20

    if (req.locals && req.locals.proLimit) {
      if (array.length <= PRO_INPUT_SIZE) return true
    } else if (array.length <= FREEMIUM_INPUT_SIZE) {
      return true
    }

    return false
  }

  // Axios options used when calling axios.post() to talk with a full node.
  getAxiosOptions () {
    return {
      method: 'post',
      baseURL: process.env.RPC_BASEURL,
      timeout: 15000,
      auth: {
        username: process.env.RPC_USERNAME,
        password: process.env.RPC_PASSWORD
      },
      data: {
        jsonrpc: '1.0'
      }
    }
  }

  // Returns true if user-provided cash address matches the correct network,
  // mainnet or testnet. If NETWORK env var is not defined, it returns false.
  // This prevent a common user-error issue that is easy to make: passing a
  // testnet address into rest.bitcoin.com or passing a mainnet address into
  // trest.bitcoin.com.
  validateNetwork (addr) {
    try {
      const network = process.env.NETWORK

      // Return false if NETWORK is not defined.
      if (!network || network === '') {
        console.log('Warning: NETWORK environment variable is not defined!')
        return false
      }

      // Convert the user-provided address to a cashaddress, for easy detection
      // of the intended network.
      const cashAddr = this.bchjs.Address.toCashAddress(addr)

      // Return true if the network and address both match testnet
      const addrIsTest = this.bchjs.Address.isTestnetAddress(cashAddr)
      if (network === 'testnet' && addrIsTest) return true

      // Return true if the network and address both match mainnet
      const addrIsMain = this.bchjs.Address.isMainnetAddress(cashAddr)
      if (network === 'mainnet' && addrIsMain) return true

      return false
    } catch (err) {
      wlogger.error('Error in validateNetwork()')
      return false
    }
  }

  // Error messages returned by a full node can be burried pretty deep inside the
  // error object returned by Axios. This function attempts to extract and interpret
  // error messages.
  // Returns an object. If successful, obj.msg is a string.
  // If there is a failure, obj.msg is false.
  decodeError (err) {
    try {
      // Attempt to extract the full node error message.
      if (
        err.response &&
        err.response.data &&
        err.response.data.error &&
        err.response.data.error.message
      ) {
        return { msg: err.response.data.error.message, status: 400 }
      }

      // Attempt to extract the Insight error message
      if (err.response && err.response.data) {
        return { msg: err.response.data, status: err.response.status }
      }

      // console.log(`err.message: ${err.message}`)
      // console.log(`err: `, err)

      // Attempt to detect a network connection error.
      if (err.message && err.message.indexOf('ENOTFOUND') > -1) {
        return {
          msg:
            'Network error: Could not communicate with full node or other external service.',
          status: 503
        }
      }

      // Different kind of network error
      if (err.message && err.message.indexOf('ENETUNREACH') > -1) {
        return {
          msg:
            'Network error: Could not communicate with full node or other external service.',
          status: 503
        }
      }

      // Different kind of network error
      if (err.message && err.message.indexOf('EAI_AGAIN') > -1) {
        return {
          msg:
            'Network error: Could not communicate with full node or other external service.',
          status: 503
        }
      }

      // Axios timeout (aborted) error, or service is down (connection refused).
      if (
        err.code &&
        (err.code === 'ECONNABORTED' || err.code === 'ECONNREFUSED')
      ) {
        return {
          msg:
            'Network error: Could not communicate with full node or other external service.',
          status: 503
        }
      }

      // Handle 429 errors
      if (err.error) {
        console.log('decodeError: err: ', err)

        // Error thrown by nginx (usually the SLPDB load balancer.)
        if (err.error.includes('429 Too Many Requests')) {
          const internalMsg =
            '429 error thrown by nginx caught by route-utils.js/decodeError()'
          console.error(internalMsg)
          wlogger.error(internalMsg)

          return {
            msg: '429 Too Many Requests',
            status: 429
          }
        } else if (err.error.includes('Too many requests')) {
          // Error is being thrown by bch-api rate limit middleware.
          return {
            msg: '429 Too Many Requests',
            status: 429
          }
        } else if (err.error.includes('Network error:')) {
          return {
            msg: err.error,
            status: 503
          }
        }
      }

      // Handle general Error objects.
      if (err.message) {
        return {
          msg: err.message,
          status: 422
        }
      }

      return { msg: false, status: 500 }
    } catch (err) {
      console.error('unhandled error in route-utils.js/decodeError(): ', err)
      wlogger.error('unhandled error in route-utils.js/decodeError(): ', err)
      return { msg: false, status: 500 }
    }
  }

  // Dynamically set these based on env vars. Allows unit testing.
  setEnvVars () {
    const BitboxHTTP = axios.create({
      baseURL: process.env.RPC_BASEURL,
      timeout: 15000
    })
    const username = process.env.RPC_USERNAME
    const password = process.env.RPC_PASSWORD

    const requestConfig = {
      method: 'post',
      auth: {
        username: username,
        password: password
      },
      data: {
        jsonrpc: '1.0'
      }
    }

    return { BitboxHTTP, username, password, requestConfig }
  }
}

module.exports = RouteUtils
