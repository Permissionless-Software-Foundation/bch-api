/*
  This integration tests should be run against a live bch-api REST server. It
  tests to ensure the rate-limits are working as expected. Adjust the values
  in the tests below to match the rate limit setting in your own installation.
 */

'use strict'

const chai = require('chai')
const assert = chai.assert
const axios = require('axios')

// Used for debugging.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// const SERVER = `http://192.168.0.36:12400/v3/`
const SERVER = 'http://localhost:3000/v3/'
// const SERVER = 'https://api.fullstack.cash/v3/'

const TEST_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlODhhY2JmMDIyMWMxMDAxMmFkOTNmZiIsImVtYWlsIjoiY2hyaXMudHJvdXRuZXJAZ21haWwuY29tIiwiYXBpTGV2ZWwiOjQwLCJyYXRlTGltaXQiOjMsImlhdCI6MTYwMDYyODk1MSwiZXhwIjoxNjAzMjIwOTUxfQ.JPXDJQsxJFtCGZjHOd-hRfJuY41Ef_FQ4ET06CtYdNk'

describe('#rate limits', () => {
  it('should get control/getNetworkInfo() with no auth', async () => {
    const options = {
      method: 'GET',
      url: `${SERVER}control/getNetworkInfo`
    }

    const result = await axios(options)
    // console.log(`result.status: ${result.status}`)
    // console.log(`result.data: ${util.inspect(result.data)}`)

    assert.equal(result.status, 200)
    assert.hasAnyKeys(result.data, ['version'])
  })

  it('should trigger rate-limit handler if rate limits exceeds 5 request per minute', async () => {
    try {
      // Actual rate limit is 60 per minute X 4 nodes = 240 rpm.
      const options = {
        method: 'GET',
        url: `${SERVER}control/getNetworkInfo`
      }

      const promises = []
      for (let i = 0; i < 5; i++) {
        const promise = axios(options)
        promises.push(promise)
      }

      await Promise.all(promises)

      assert.equal(true, false, 'Unexpected result!')
    } catch (err) {
      // console.log(`err.response: ${util.inspect(err.response)}`)

      assert.equal(err.response.status, 429)
      assert.include(err.response.data.error, 'Too many requests')
    }
  })

  // it('should not trigger rate-limit handler if correct pro-tier password is used', async () => {
  //   try {
  //     const username = 'BITBOX'
  //
  //     // Pro-tier is accessed by using the right password.
  //     const password = 'BITBOX'
  //     // const password = "something"
  //
  //     const combined = `${username}:${password}`
  //     const base64Credential = Buffer.from(combined).toString('base64')
  //     const readyCredential = `Basic ${base64Credential}`
  //
  //     const options = {
  //       method: 'GET',
  //       url: `${SERVER}control/getNetworkInfo`,
  //       headers: { Authorization: readyCredential }
  //     }
  //
  //     const promises = []
  //     for (let i = 0; i < 30; i++) {
  //       const promise = axios(options)
  //       promises.push(promise)
  //     }
  //
  //     await Promise.all(promises)
  //
  //     assert.equal(true, true, 'Not throwing an error is a pass!')
  //   } catch (err) {
  //     // console.log(`err.response: ${util.inspect(err.response)}`)
  //
  //     assert.equal(
  //       true,
  //       false,
  //       'This error handler should not have been triggered. Is the password correct?'
  //     )
  //   }
  // })

  // it('should trigger rate-limit handler if rate limits exceeds pro-tier limit', async () => {
  //   try {
  //     const username = 'BITBOX'
  //
  //     // Pro-tier is accessed by using the right password.
  //     const password = 'BITBOX'
  //     // const password = "something"
  //
  //     const combined = `${username}:${password}`
  //     const base64Credential = Buffer.from(combined).toString('base64')
  //     const readyCredential = `Basic ${base64Credential}`
  //
  //     // Actual rate limit is 60 per minute X 4 nodes = 240 rpm.
  //     const options = {
  //       method: 'GET',
  //       url: `${SERVER}control/getNetworkInfo`,
  //       headers: { Authorization: readyCredential }
  //     }
  //
  //     const promises = []
  //     for (let i = 0; i < 80; i++) {
  //       const promise = axios(options)
  //       promises.push(promise)
  //     }
  //
  //     await Promise.all(promises)
  //
  //     assert.equal(true, false, 'Unexpected result!')
  //   } catch (err) {
  //     // console.log(`err.response: ${util.inspect(err.response)}`)
  //
  //     assert.equal(err.response.status, 429)
  //     assert.include(err.response.data.error, 'Too many requests')
  //   }
  // })

  it('should unlock pro-tier for a valid JWT token', async () => {
    try {
      // Actual rate limit is 60 per minute X 4 nodes = 240 rpm.
      const options = {
        method: 'GET',
        url: `${SERVER}control/`,
        headers: {
          Authorization: `Token ${TEST_JWT}`
        }
      }

      const promises = []
      for (let i = 0; i < 60; i++) {
        const promise = axios(options)
        promises.push(promise)
      }

      await Promise.all(promises)

      // assert.equal(true, false, "Unexpected result!")
      assert.equal(true, true, 'Not throwing an error is a pass!')
    } catch (err) {
      console.log(`err.response: ${util.inspect(err.response)}`)

      assert.equal(true, false, 'Unexpected result!')
    }
    // Override default timeout for this test.
  }).timeout(20000)
})
