"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const rawTransactionsRoute = require("../../dist/routes/v1/rawtransactions")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true
}

describe("#RawTransactionsRouter", () => {
  describe("#root", () => {
    it("should return 'rawtransactions' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      rawTransactionsRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "rawtransactions"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#DecodeRawTransaction", () => {
    it("should GET /decodeRawTransaction/:hex", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/decodeRawTransaction/["0200000001d0ba1330194111747e0b1784ab62126871c87acad3b6dc3a339b261ad974e940010000006b483045022100a284b4ac5ed55ac0e2baa02b6bdabbf06f98d2bf6b3fdcea1aea50f55766afd002206181c8e60f738116ba6e16177f3d408e8da2c463c69b27c2531fab84b63a63b24121022d426ef365d6480b127b4980afa4b9415cad5e6f0a9e11b1536d3523597197f3ffffffff02011d0000000000001976a91479d3297d1823149f4ec61df31d19f2fad5390c0288ac0000000000000000116a0f23424348466f7245766572796f6e6500000000"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        //console.log(`actualResponseBody: ${util.inspect(actualResponseBody)}`)
        assert.deepEqual(actualResponseBody, [
          "txid",
          "hash",
          "size",
          "version",
          "locktime",
          "vin",
          "vout"
        ])
        done()
      })
    })
  })

  describe("#DecodeScript", () => {
    it("should GET /decodeScript/:script", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/decodeScript/["4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, ["asm", "type", "p2sh"])
        done()
      })
    })
  })

  describe("#GetRawTransaction", () => {
    it("should GET /getRawTransaction/:txid", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getRawTransaction/["0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000"
        )
        done()
      })
    })
  })

  describe("#SendRawTransaction", () => {
    it("should POST /sendRawTransaction/:hex single tx hex", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          '/sendRawTransaction/["01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(actualResponseBody, "transaction already in block chain")
        done()
      })
    })
    //
    //   it("should POST /sendRawTransaction/:hex array", (done) => {
    //     let hex1 = '020000000148735fcdac94c51459f7d8f787cf363c618125bc0f9092092ed2ebccd0f5557e0000000069463043021f4e3dd1fadb3e8fabdbd94b125d7e97932f72bb08118407e49cf505e7f5f63b022062eee3c5d94b4bc6b68ab0018876e9661b257f1e8487173876faccf7d3a2220541210313299e9ec7a9e62789094b850ab6f71df7c39af7c03568027c24d0bc9eda930dffffffff017b140000000000001976a914e11ed7fd6416d8f5c58a1cb3e1b0005c3cab092f88ac00000000';
    //     let hex2 = '0200000001a1b5849a5026642d5e28abdb4e98aa483adc20daab44c39e2f41acf72aa8c845000000006b483045022100994ab28c7df64852057c3ab965148ef2b5456233c12774087e88a62bbc27d4230220504d1096ac52915d32d2356ba5ae82f202543b88c24b4643800919e85da333984121039c48c06ce551810a2eeedf516c77995a922ca65c4e9e9a0a07288a6fae149eb2ffffffff013b1e0000000000001976a9140377597dd75d41398259c36d05a5a68ba0af782d88ac00000000';
    //     let arr = [hex1, hex2];
    //     let mockRequest = httpMocks.createRequest({
    //       method: "POST",
    //       url: '/sendRawTransaction/' + arr
    //     });
    //     let mockResponse = httpMocks.createResponse({
    //       eventEmitter: require('events').EventEmitter
    //     });
    //     rawTransactionsRoute(mockRequest, mockResponse);
    //
    //     mockResponse.on('end', () => {
    //       let actualResponseBody = mockResponse._getData();
    //       assert.equal(actualResponseBody, 'transaction already in block chain');
    //       done();
    //     });
    //   });
  })

  /*
  describe("#change", () => {
    it("should POST /change/:rawtx/:prevTxs/:destination/:fee", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          '/change/0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff025c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000/[{"txid":"6779a710fcd5f6fb0883ea3306360c3ad8c0a3c5de902768ec57ef3104e65eb1","vout":4,"scriptPubKey":"76a9147b25205fd98d462880a3e5b0541235831ae959e588ac","value":0.00068257}]/bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg/0.00003500'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff03efe40000000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac5c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
        )
        done()
      })
    })
  })
  */

  describe("#input", () => {
    it("should POST /input/:rawTx/:txid/:n", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          "/input/01000000000000000000/b006729017df05eda586df9ad3f8ccfee5be340aadf88155b784d1fc0e8342ee/0"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0100000001ee42830efcd184b75581f8ad0a34bee5feccf8d39adf86a5ed05df17907206b00000000000ffffffff0000000000"
        )
        done()
      })
    })
  })

  describe("#opReturn", () => {
    it("should POST /opReturn/:rawTx/:payload", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url: "/opReturn/01000000000000000000/00000000000000020000000006dac2c0"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0100000000010000000000000000166a140877686300000000000000020000000006dac2c000000000"
        )
        done()
      })
    })
  })

  /*
  describe("#reference", () => {
    it("should POST /reference/:rawTx/:destination", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          "/reference/0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff03aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000/bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg?amount=0.005"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff04aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac20a10700000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac00000000"
        )
        done()
      })
    })
  })
  */

  /*
  describe("#decodeTransaction", () => {
    it("should POST /decodeTransaction/:rawTx", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          '/decodeTransaction/010000000163af14ce6d477e1c793507e32a5b7696288fa89705c0d02a3f66beb3c5b8afee0100000000ffffffff02ac020000000000004751210261ea979f6a06f9dafe00fb1263ea0aca959875a7073556a088cdfadcd494b3752102a3fd0a8a067e06941e066f78d930bfc47746f097fcd3f7ab27db8ddf37168b6b52ae22020000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000?prevTxs=[{"txid":"eeafb8c5b3be663f2ad0c00597a88f2896765b2ae30735791c7e476dce14af63","vout":1,"scriptPubKey":"76a9149084c0bd89289bc025d0264f7f23148fb683d56c88ac","value":0.0001123}]'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = mockResponse._getData()
        assert.equal(actualResponseBody, "Not a Master Protocol transaction")
        done()
      })
    })
  })
*/

  describe("#create", () => {
    it("should POST /create/:inputs/:outputs", done => {
      const mockRequest = httpMocks.createRequest({
        method: "POST",
        url:
          '/create/ [{"txid":"eeafb8c5b3be663f2ad0c00597a88f2896765b2ae30735791c7e476dce14af63","vout":1}]/{}'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      rawTransactionsRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(
          actualResponseBody,
          "020000000163af14ce6d477e1c793507e32a5b7696288fa89705c0d02a3f66beb3c5b8afee0100000000ffffffff0000000000"
        )
        done()
      })
    })
  })
})
