"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const healthCheckRoute = require("../../dist/routes/v1/health-check")

describe("#HealthCheckRouter", () => {
  describe("#root", () => {
    it("should return 'winning' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      healthCheckRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "winning"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })
})
