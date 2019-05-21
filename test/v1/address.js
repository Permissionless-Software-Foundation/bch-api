"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const addressRoute = require("../../dist/routes/v1/address")

const util = require("util")
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true
}

describe("#AddressRouter", () => {
  describe("#root", () => {
    it("should return 'address' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      addressRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "address"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#AddressDetails", () => {
    it("should GET /details/:address single address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/details/["qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "balance",
          "balanceSat",
          "totalReceived",
          "totalReceivedSat",
          "totalSent",
          "totalSentSat",
          "unconfirmedBalance",
          "unconfirmedBalanceSat",
          "unconfirmedTxAppearances",
          "txAppearances",
          "transactions",
          "legacyAddress",
          "cashAddress"
        ])
        done()
      })
    })

    it("should GET /details/:address array of addresses", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/details/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr", "qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "balance",
          "balanceSat",
          "totalReceived",
          "totalReceivedSat",
          "totalSent",
          "totalSentSat",
          "unconfirmedBalance",
          "unconfirmedBalanceSat",
          "unconfirmedTxAppearances",
          "txAppearances",
          "transactions",
          "legacyAddress",
          "cashAddress"
        ])
        done()
      })
    })
  })

  describe("#AddressUtxo", () => {
    it("should GET /utxo/:address single address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/utxo/["qpk4hk3wuxe2uqtqc97n8atzrrr6r5mleczf9sur4h"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0][0]
        )
        assert.deepEqual(actualResponseBody, [
          "txid",
          "vout",
          "scriptPubKey",
          "amount",
          "satoshis",
          "height",
          "confirmations",
          "legacyAddress",
          "cashAddress"
        ])
        done()
      })
    })

    it("should GET /utxo/:address array of addresses", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/utxo/["qz4q7h2jxmfhg3l7r7zeumzgeh7gyp6shuqmq5h6np", "qzqlp044n3qn7kntlc0mr5tp2a0ee0vvyq9yyyyjh0"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[1][0]
        )
        assert.deepEqual(actualResponseBody, [
          "txid",
          "vout",
          "scriptPubKey",
          "amount",
          "satoshis",
          "height",
          "confirmations",
          "legacyAddress",
          "cashAddress"
        ])
        done()
      })
    })
  })

  describe("#AddressUnconfirmed", () => {
    it("should GET /unconfirmed/:address single address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/unconfirmed/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [])
        // assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done()
      })
    })

    it("should GET /unconfirmed/:address array of addresses", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/unconfirmed/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr", "qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      addressRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [])
        // assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done()
      })
    })
  })
})
