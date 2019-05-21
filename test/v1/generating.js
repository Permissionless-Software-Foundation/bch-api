"use strict"

// const chai = require("chai");
const assert = require("assert")
// const expect = chai.expect;
const httpMocks = require("node-mocks-http")
const generatingRoute = require("../../dist/routes/v1/generating")

describe("#GeneratingRouter", () => {
  describe("#root", () => {
    it("should return 'generating' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      generatingRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "generating"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })
  //
  //   describe("#GeneratingGenerateToAddress", () => {
  //     it("should POST /generateToAddress/:n/:address ", (done) => {
  //       let mockRequest = httpMocks.createRequest({
  //         method: "POST",
  //         url: "/generateToAddress/1/qrff52mj0ml4scljzxrex7ses2gst42k9sfz2lftjq"
  //       });
  //       let mockResponse = httpMocks.createResponse({
  //         eventEmitter: require('events').EventEmitter
  //       });
  //       generatingRoute(mockRequest, mockResponse);
  //
  //       mockResponse.on('end', () => {
  //         let actualResponseBody = mockResponse._getData();
  //         assert.equal(actualResponseBody, "JSON value is not an integer as expected");
  //         done();
  //       });
  //     });
  //   });
})
