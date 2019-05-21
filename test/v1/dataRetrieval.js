"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const dataRetrieval = require("../../dist/routes/v1/dataRetrieval")

describe("#dataRetrievalRouter", () => {
  describe("#root", () => {
    it("should return 'dataRetrieval' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      dataRetrieval(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "dataRetrieval"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#balancesForAddress", () => {
    it("should GET /balancesForAddress/:address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/balancesForAddress/bitcoincash:qqnjqejdq77pjqhg2y009fck50wdzzh3mc667y7075"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.deepEqual(actualResponseBody[0], {
          propertyid: 189,
          balance: "1.0",
          reserved: "0.0"
        })
        done()
      })
    })
  })
  /*
  describe("#balancesForId", () => {
    it("should GET /balancesForId/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/balancesForId/189"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        //console.log(`actualResponseBody: ${JSON.stringify(actualResponseBody, null, 2)}`)

        assert.deepEqual(actualResponseBody, {
          address: "bitcoincash:qzgvcvfkupltwn2k8c0y8hddhwffxg7p35s834qcuz",
          balance: "1.0",
          reserved: "0.0"
        })
        done()
      })
    })
  })
*/
  describe("#balanceAddressAndPropertyId", () => {
    it("should GET /balance/:address/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/balance/bitcoincash:qqnjqejdq77pjqhg2y009fck50wdzzh3mc667y7075/189"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.deepEqual(actualResponseBody, {
          balance: "1.0",
          reserved: "0.0"
        })
        done()
      })
    })
  })

  describe("#balancesHash", () => {
    it("should GET /balancesHash/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/balancesHash/127"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "block",
          "blockhash",
          "propertyid",
          "balanceshash"
        ])
        done()
      })
    })
  })

  describe("#crowdSale", () => {
    it("should GET /crowdSale/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/crowdSale/190"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )

        assert.deepEqual(actualResponseBody, [
          "propertyid",
          "name",
          "active",
          "issuer",
          "propertyiddesired",
          "precision",
          "tokensperunit",
          "earlybonus",
          "starttime",
          "deadline",
          "amountraised",
          "tokensissued",
          "addedissuertokens",
          "closedearly",
          "maxtokens",
          "endedtime",
          "closetx"
        ])
        done()
      })
    })
  })

  describe("#currentConsensusHash", () => {
    it("should GET /currentConsensusHash", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/currentConsensusHash"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "block",
          "blockhash",
          "consensushash"
        ])
        done()
      })
    })
  })

  describe("#grants", () => {
    it("should GET /grants/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/grants/189"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )

        assert.deepEqual(actualResponseBody, [
          "propertyid",
          "name",
          "issuer",
          "creationtxid",
          "totaltokens",
          "issuances"
        ])
        done()
      })
    })
  })
  /*
  describe("#info", () => {
    it("should GET /info", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/info"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "wormholeversion_int",
          "wormholeversion",
          "bitcoincoreversion",
          "block",
          "blocktime",
          "blocktransactions",
          "totaltrades",
          "totaltransactions",
          "alerts"
        ])
        done()
      })
    })
  })
*/
  describe("#payload", () => {
    it("should GET /payload/:txid", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/payload/709d1346a781e7e0064393c9b3f0e846ee445958946352b5928084e8d9a410cc"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, ["payload", "payloadsize"])
        done()
      })
    })
  })

  describe("#property", () => {
    it("should GET /property/:propertyId", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/property/127"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "propertyid",
          "name",
          "category",
          "subcategory",
          "data",
          "url",
          "precision",
          "issuer",
          "creationtxid",
          "fixedissuance",
          "managedissuance",
          "totaltokens"
        ])
        done()
      })
    })
  })

  describe("#seedBlocks", () => {
    it("should GET /seedBlocks/:startBlock/:endBlock", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/seedBlocks/290000/300000"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [])
        done()
      })
    })
  })
  /*
  describe("#STO", () => {
    it("should GET /STO/:txid", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        //url: "/STO/ac2df919be43fa793ff4955019195481878e0f0cab39834ad911124fdacfc603/*",
        url: "/STO/744b6b3c287d836814c615b532737c080d07ddb48d891f9b0159196ee910b45c/*",
      });
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter,
      });
      dataRetrieval(mockRequest, mockResponse);

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(JSON.parse(mockResponse._getData()));
        assert.deepEqual(actualResponseBody, [
          "txid",
          "fee",
          "sendingaddress",
          "ismine",
          "version",
          "type_int",
          "type",
          "propertyid",
          "precision",
          "ecosystem",
          "category",
          "subcategory",
          "propertyname",
          "data",
          "url",
          "amount",
          "valid",
          "blockhash",
          "blocktime",
          "positioninblock",
          "block",
          "confirmations",
        ]);
        done();
      });
    });
  });
*/
  describe("#transaction", () => {
    it("should GET /transaction/:txid", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        //url: "/transaction/ac2df919be43fa793ff4955019195481878e0f0cab39834ad911124fdacfc603",
        url:
          "/transaction/744b6b3c287d836814c615b532737c080d07ddb48d891f9b0159196ee910b45c"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )

        assert.deepEqual(actualResponseBody, [
          "txid",
          "fee",
          "sendingaddress",
          "ismine",
          "version",
          "type_int",
          "type",
          "propertyid",
          "precision",
          //"ecosystem",
          //"category",
          //"subcategory",
          //"propertyname",
          //"data",
          //"url",
          //"amount",
          "valid",
          "blockhash",
          "blocktime",
          "positioninblock",
          "block",
          "confirmations"
        ])
        done()
      })
    })
  })

  describe("#blockTransactions", () => {
    it("should GET /blockTransactions/:index", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/blockTransactions/279007"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [])
        done()
      })
    })
  })

  describe("#pendingTransactions", () => {
    it("should GET /pendingTransactions", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/pendingTransactions"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.equal(Array.isArray(actualResponseBody), true)
        done()
      })
    })
  })

  describe("#properties", () => {
    it("should GET /properties", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/properties"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      dataRetrieval(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "propertyid",
          "name",
          "category",
          "subcategory",
          "data",
          "url",
          "precision"
        ])
        done()
      })
    })
  })
})
