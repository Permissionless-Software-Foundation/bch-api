"use strict"

//const chai = require("chai");
const assert = require("assert")
//const expect = chai.expect;
const httpMocks = require("node-mocks-http")
const networkRoute = require("../../dist/routes/v1/network")

describe("#NetworkRouter", () => {
  describe("#root", () => {
    it("should return 'network' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      networkRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "network"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })
  //
  // describe("#NetworkGetConnectionCount", () => {
  //   it("should GET /getConnectionCount ", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getConnectionCount"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     networkRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = parseInt(mockResponse._getData());
  //       assert.equal(typeof actualResponseBody, "number");
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#NetworkGetNetTotals", () => {
  //   it("should GET /getNetTotals ", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getNetTotals"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     networkRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData()));
  //       assert.deepEqual(actualResponseBody, [ 'totalbytesrecv', 'totalbytessent', 'timemillis', 'uploadtarget' ]);
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#NetworkGetNetworkInfo", () => {
  //   it("should GET /getNetworkInfo", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getNetworkInfo"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     networkRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData()));
  //       assert.deepEqual(actualResponseBody, [ 'version', 'subversion', 'protocolversion', 'localservices', 'localrelay', 'timeoffset', 'networkactive', 'connections', 'networks', 'relayfee', 'incrementalfee', 'localaddresses', 'warnings' ]);
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#NetworkGetPeerInfo", () => {
  //   it("should GET /getPeerInfo", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getPeerInfo"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     networkRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData())[0]);
  //       assert.deepEqual(actualResponseBody, [ 'id', 'addr', 'addrlocal', 'services', 'relaytxes', 'lastsend', 'lastrecv', 'bytessent', 'bytesrecv', 'conntime', 'timeoffset', 'pingtime', 'minping', 'version', 'subver', 'inbound', 'addnode', 'startingheight', 'banscore', 'synced_headers', 'synced_blocks', 'inflight', 'whitelisted', 'bytessent_per_msg', 'bytesrecv_per_msg' ]);
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#NetworkPing", () => {
  //   it("should GET /ping", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/ping"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     networkRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = JSON.parse(mockResponse._getData());
  //       assert.equal(actualResponseBody, 'null');
  //       done();
  //     });
  //   });
  // });
})
