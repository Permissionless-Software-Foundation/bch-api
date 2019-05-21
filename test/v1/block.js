"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const blockRoute = require("../../dist/routes/v1/block")

describe("#BlockRouter", () => {
  describe("#root", () => {
    it("should return 'block' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      blockRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "block"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#BlockDetails", () => {
    it("should GET /details/:id height", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/details/549608"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockRoute(mockRequest, mockResponse)
      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )

        assert.deepEqual(actualResponseBody, [
          "hash",
          "size",
          "height",
          "version",
          "merkleroot",
          "tx",
          "time",
          "nonce",
          "bits",
          "difficulty",
          "chainwork",
          "confirmations",
          "previousblockhash",
          "nextblockhash",
          "reward",
          "isMainChain",
          "poolInfo"
        ])
        done()
      })
    })

    it("should GET /details/:id hash", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/details/00000000000000000182bf5782f3d43b1a8fceccb50253eb61e58cba7b240edc"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "hash",
          "size",
          "height",
          "version",
          "merkleroot",
          "tx",
          "time",
          "nonce",
          "bits",
          "difficulty",
          "chainwork",
          "confirmations",
          "previousblockhash",
          "nextblockhash",
          "reward",
          "isMainChain",
          "poolInfo"
        ])
        done()
      })
    })
  })
})
