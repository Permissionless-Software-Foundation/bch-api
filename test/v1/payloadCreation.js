"use strict"
//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const payloadCreation = require("../../dist/routes/v1/payloadCreation")

describe("#payloadCreationRouter", () => {
  describe("#root", () => {
    it("should return 'payloadCreation' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      payloadCreation(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "payloadCreation"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#burnBCH", () => {
    it("should GET /burnBCH", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/burnBCH"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody, "00000044")
        done()
      })
    })
  })

  describe("#changeIssuer", () => {
    it("should POST /changeIssuer/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/changeIssuer/3"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody, "0000004600000003")
        done()
      })
    })
  })

  describe("#closeCrowdSale", () => {
    it("should POST /closeCrowdSale/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/closeCrowdSale/70"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody, "0000003500000046")
        done()
      })
    })
  })

  describe("#grant", () => {
    it("should POST /grant/:propertyId/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/grant/189/7000"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())

        assert.equal(actualResponseBody, "00000037000000bd000000000001117000")
        done()
      })
    })
  })

  describe("#crowdsale", () => {
    // CT 10/25/18: This test is commented out because I can't figure out how to
    // test a thrown error with node-mocks-http. z
    /*
    it("should reject invalid date", done => {
      try {
        const mockRequest = httpMocks.createRequest({
          method: "POST",
          url:
            "/crowdsale/1/1/0/Companies/Bitcoin-Mining/Quantum-Miner/www.example.com/Quantum -Miner-Tokens/1/100/7308955112/30/0/192978657"
        })
        const mockResponse = httpMocks.createResponse({
          eventEmitter: require("events").EventEmitter
        })
        payloadCreation(mockRequest, mockResponse)

        mockResponse.on("end", () => {
          const actualResponseBody = JSON.parse(mockResponse._getData())
          console.log(
            `actualResponseBody: ${JSON.stringify(actualResponseBody, null, 2)}`
          )
          //assert.equal(
          //  actualResponseBody,
          //  "0000003301000100000000436f6d70616e69657300426974636f696e2d4d696e696e67005175616e74756d2d4d696e6572007777772e6578616d706c652e636f6d005175616e74756d202d4d696e65722d546f6b656e73000000000100000002540be40000000000586846801e0000000000730634ca"
          //)
          assert.equal(true, true)
          done()
        })
      } catch (err) {
        console.log(`Error: ${JSON.stringify(err, null, 2)}`)
        assert.equal(true, true)
        done()
      }
    })
    */

    it("should POST /crowdsale/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data/:propertyIdDesired/:tokensPerUnit/:deadline/:earlyBonus/:undefine/:totalNumber", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          "/crowdsale/1/1/0/Companies/Bitcoin-Mining/Quantum-Miner/www.example.com/Quantum -Miner-Tokens/1/100/1483228800/30/0/192978657"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0000003301000100000000436f6d70616e69657300426974636f696e2d4d696e696e67005175616e74756d2d4d696e6572007777772e6578616d706c652e636f6d005175616e74756d202d4d696e65722d546f6b656e73000000000100000002540be40000000000586846801e0000000000730634ca"
        )
        done()
      })
    })
  })

  describe("#fixed", () => {
    it("should POST /fixed/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          "/fixed/1/1/0/Companies/Bitcoin-Mining/Quantum-Miner/www.example.com/Quantum-Miner-Tokens/1000000"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0000003201000100000000436f6d70616e69657300426974636f696e2d4d696e696e67005175616e74756d2d4d696e6572007777772e6578616d706c652e636f6d005175616e74756d2d4d696e65722d546f6b656e73000000000000989680"
        )
        done()
      })
    })
  })

  describe("#managed", () => {
    it("should POST /managed/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          "/managed/1/1/0/Companies/Bitcoin-Mining/Quantum-Miner/www.example.com/Quantum-Miner-Tokens"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0000003601000100000000436f6d70616e69657300426974636f696e2d4d696e696e67005175616e74756d2d4d696e6572007777772e6578616d706c652e636f6d005175616e74756d2d4d696e65722d546f6b656e7300"
        )
        done()
      })
    })
  })

  describe("#participateCrowdSale", () => {
    it("should POST /participateCrowdSale/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/participateCrowdSale/100.0"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody, "000000010000000100000002540be400")
        done()
      })
    })
  })

  describe("#revoke", () => {
    it("should POST /revoke/:propertyId/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        //url: "/revoke/3/100", // testnet
        url: "/revoke/189/100"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        //console.log(`actualResponseBody: ${JSON.stringify(actualResponseBody, null, 2)}`);

        assert.equal(actualResponseBody, "00000038000000bd00000000000003e800")
        done()
      })
    })
  })

  describe("#sendAll", () => {
    it("should POST /sendAll/:ecosystem", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        //url: "/sendAll/2", // testnet
        url: "/sendAll/1" // mainnet
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        //console.log(`actualResponseBody: ${JSON.stringify(actualResponseBody, null, 2)}`);

        assert.equal(actualResponseBody, "0000000401")
        done()
      })
    })
  })

  describe("#simpleSend", () => {
    it("should POST /simpleSend/:propertyId/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/simpleSend/1/100.0"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody, "000000000000000100000002540be400")
        done()
      })
    })
  })

  describe("#STO", () => {
    it("should POST /STO/:propertyId/:amount", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/STO/3/5000"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      payloadCreation(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0000000300000003000000000000138800000003"
        )
        done()
      })
    })
  })
})
