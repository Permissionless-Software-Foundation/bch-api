"use strict"

//const chai = require("chai");
const assert = require("assert")
//const expect = chai.expect;
const httpMocks = require("node-mocks-http")
const miningRoute = require("../../dist/routes/v1/mining")

describe("#MiningRouter", () => {
  describe("#root", () => {
    it("should return 'mining' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      miningRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "mining"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  //
  // describe("#MiningGetBlockTemplate", () => {
  //   it("should GET /getBlockTemplate", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getBlockTemplate/{}"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     miningRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = mockResponse._getData();
  //       assert.equal(actualResponseBody, 'JSON value is not an object as expected');
  //       done();
  //     });
  //   });
  // });

  describe("#MiningGetMiningInfo", () => {
    it("should GET /getMiningInfo", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getMiningInfo"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      miningRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "blocks",
          "currentblocksize",
          "currentblocktx",
          "difficulty",
          "blockprioritypercentage",
          "errors",
          "networkhashps",
          "pooledtx",
          "chain"
        ])
        done()
      })
    })
  })

  describe("#MiningGetNetworkHashps", () => {
    it("should GET /getNetworkHashps", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getNetworkHashps"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      miningRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = parseInt(mockResponse._getData())
        assert.equal(typeof actualResponseBody, "number")
        done()
      })
    })
  })
  //
  // describe("#MiningSubmitBlock", () => {
  //   it("should POST /SubmitBlock", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "POST",
  //       url: "/submitBlock/000000000000000000df19ff517463e288aca3de261ece7d53f97da65f9b7b8d"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     miningRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = mockResponse._getData();
  //       assert.equal(actualResponseBody, "Block decode failed");
  //       done();
  //     });
  //   });
  // });
})
