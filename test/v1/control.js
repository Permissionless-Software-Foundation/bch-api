"use strict"

//const chai = require("chai");
const assert = require("assert")
//const expect = chai.expect;
const httpMocks = require("node-mocks-http")
const controlRoute = require("../../dist/routes/v1/control")

describe("#ControlRouter", () => {
  describe("#root", () => {
    it("should return 'control' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      controlRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "control"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })
  /*
  describe("#GetInfo", () => {
    it("should GET /getInfo", (done) => {
      let mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getInfo"
      });
      let mockResponse = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
      controlRoute(mockRequest, mockResponse);

      mockResponse.on('end', () => {
        let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData()));
        assert.deepEqual(actualResponseBody, [ 'version', 'protocolversion', 'blocks', 'timeoffset', 'connections', 'proxy', 'difficulty', 'testnet', 'paytxfee', 'relayfee', 'errors' ]);
        done();
      });
    });
  });
//
//   describe("#GetMemoryInfo", () => {
//     it("should GET /getMemoryInfo ", (done) => {
//       let mockRequest = httpMocks.createRequest({
//         method: "GET",
//         url: "/getMemoryInfo"
//       });
//       let mockResponse = httpMocks.createResponse({
//         eventEmitter: require('events').EventEmitter
//       });
//       controlRoute(mockRequest, mockResponse);
//
//       mockResponse.on('end', () => {
//         let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData()).locked);
//         assert.deepEqual(actualResponseBody, [ 'used', 'free', 'total', 'locked', 'chunks_used', 'chunks_free' ]);
//         done();
//       });
//     });
//   });
*/
})
