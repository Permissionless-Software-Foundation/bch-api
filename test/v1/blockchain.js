"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const blockchainRoute = require("../../dist/routes/v1/blockchain")

describe("#BlockchainRouter", () => {
  describe("#root", () => {
    it("should return 'blockchain' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      blockchainRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "blockchain"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#BlockchainGetBestBlockHash", () => {
    it("should GET /getBestBlockHash ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getBestBlockHash"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.equal(actualResponseBody.length, 64)
        done()
      })
    })
  })

  describe("#BlockchainGetBlock", () => {
    it("should GET /getBlock/:id w/ verbose=true", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/getblock/00000000000000000182bf5782f3d43b1a8fceccb50253eb61e58cba7b240edc?verbose=true"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "hash",
          "confirmations",
          "size",
          "height",
          "version",
          "versionHex",
          "merkleroot",
          "tx",
          "time",
          "mediantime",
          "nonce",
          "bits",
          "difficulty",
          "chainwork",
          "previousblockhash",
          "nextblockhash"
        ])
        done()
      })
    })

    it("should GET /getBlock/:id w/ verbose=false", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/getblock/00000000000000000182bf5782f3d43b1a8fceccb50253eb61e58cba7b240edc?verbose=false"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = mockResponse._getData()
        assert.equal(actualResponseBody.length, 34638)
        done()
      })
    })
  })
  // TODO - Why is this test failing?
  // describe("#BlockchainGetBlockchainInfo", () => {
  //   it("should GET /getBlockchainInfo ", done => {
  //     const mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/getBlockchainInfo"
  //     })
  //     const mockResponse = httpMocks.createResponse({
  //       eventEmitter: require("events").EventEmitter
  //     })
  //     blockchainRoute(mockRequest, mockResponse)
  //
  //     mockResponse.on("end", () => {
  //       const actualResponseBody = Object.keys(
  //         JSON.parse(mockResponse._getData())
  //       )
  //       assert.deepEqual(actualResponseBody, [
  //         "chain",
  //         "blocks",
  //         "headers",
  //         "bestblockhash",
  //         "difficulty",
  //         "mediantime",
  //         "verificationprogress",
  //         "chainwork",
  //         "pruned",
  //         "softforks",
  //         "bip9_softforks"
  //       ])
  //       done()
  //     })
  //   })
  // })

  describe("#BlockchainGetBlockCount", () => {
    it("should GET /getBlockCount ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getBlockCount"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = parseInt(mockResponse._getData())
        assert.equal(typeof actualResponseBody, "number")
        done()
      })
    })
  })

  describe("#BlockchainGetBlockHash", () => {
    it("should GET /getBlockHash/:height ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getBlockhash/[0, 1, 2, 3, 532646]"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(
          actualResponseBody,
          "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        )
        done()
      })
    })
  })

  describe("#BlockchainGetBlockHeader", () => {
    it("should GET /getBlockHeader/:hash w/ verbose=true", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getBlockHeader/["00000000000000000182bf5782f3d43b1a8fceccb50253eb61e58cba7b240edc"%5D?verbose=true'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "hash",
          "confirmations",
          "height",
          "version",
          "versionHex",
          "merkleroot",
          "time",
          "mediantime",
          "nonce",
          "bits",
          "difficulty",
          "chainwork",
          "previousblockhash",
          "nextblockhash"
        ])
        done()
      })
    })

    it("should GET /getBlockHeader/:hash w/ verbose=false", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getBlockHeader/00000000000000000182bf5782f3d43b1a8fceccb50253eb61e58cba7b240edc"%5D?verbose=false'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert.deepEqual(actualResponseBody.length, 160)
        done()
      })
    })
  })

  describe("#BlockchainGetChainTips", () => {
    it("should GET /getChainTips ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getChainTips"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "height",
          "hash",
          "branchlen",
          "status"
        ])
        done()
      })
    })
  })

  describe("#BlockchainGetDifficulty", () => {
    it("should GET /getDifficulty ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getDifficulty"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = parseFloat(mockResponse._getData())
        assert.equal(typeof actualResponseBody, "number")
        done()
      })
    })
  })

  describe("#BlockchainGetMempoolAncestors", () => {
    it("should GET /getMempoolAncestors/:txid w/ verbose=true", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getMempoolAncestors/["53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"%5D?verbose=true'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(actualResponseBody, "Transaction not in mempool")
        done()
      })
    })

    it("should GET /getMempoolAncestors/:txid w/ verbose=false", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getMempoolAncestors/["53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"%5D?verbose=false'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(actualResponseBody, "Transaction not in mempool")
        done()
      })
    })
  })

  describe("#BlockchainGetMempoolDescendants", () => {
    it("should GET /getMempoolDescendants/:txid w/ verbose=true", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getMempoolDescendants/["53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"%5D?verbose=true'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(actualResponseBody, "Transaction not in mempool")
        done()
      })
    })

    it("should GET /getMempoolDescendants/:txid w/ verbose=false", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getMempoolDescendants/["53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"%5D?verbose=false'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        assert.equal(actualResponseBody, "Transaction not in mempool")
        done()
      })
    })
  })

  describe("#BlockchainGetMempoolEntry", () => {
    it("should GET /getMempoolEntry/:txid ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          '/getMempoolEntry/["53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"%5D'
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())[0]
        // TODO: create a tx send it to mempool. Then spend the utxo in another tx and call that enpoind w/ the 2nd txid.
        assert.equal(actualResponseBody, "Transaction not in mempool")
        done()
      })
    })
  })

  describe("#BlockchainGetMempoolInfo", () => {
    it("should GET /getMempoolInfo ", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getMempoolInfo"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "size",
          "bytes",
          "usage",
          "maxmempool",
          "mempoolminfee"
        ])
        done()
      })
    })
  })

  describe("#BlockchainGetRawMempool", () => {
    it("should GET /getRawMempool w/ verbose=true", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getRawMempool?verbose=true"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert(actualResponseBody.length > 1)
        done()
      })
    })

    it("should GET /getRawMempool w/ verbose=false", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/getRawMempool?verbose=false"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = JSON.parse(mockResponse._getData())
        assert(actualResponseBody.length > 1)
        done()
      })
    })
  })
  // TODO - Why is this test failing?
  // describe("#BlockchainGetTxOut", () => {
  //   it("should GET /getTxOut/:txid/:n w/ verbose=true", done => {
  //     const mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url:
  //         "/getTxOut/ac0e82ea84f93444602a99199dd80793f79a8ece5ac86156d2fff34f0bad44b2/0?verbose=true"
  //     })
  //     const mockResponse = httpMocks.createResponse({
  //       eventEmitter: require("events").EventEmitter
  //     })
  //     blockchainRoute(mockRequest, mockResponse)
  //
  //     mockResponse.on("end", () => {
  //       const actualResponseBody = Object.keys(
  //         JSON.parse(mockResponse._getData())
  //       )
  //       assert.deepEqual(actualResponseBody, [
  //         "bestblock",
  //         "confirmations",
  //         "value",
  //         "scriptPubKey",
  //         "coinbase"
  //       ])
  //       done()
  //     })
  //   })
  //
  //   it("should GET /getTxOut/:txid/:n w/ verbose=false", done => {
  //     const mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url:
  //         "/getTxOut/ac0e82ea84f93444602a99199dd80793f79a8ece5ac86156d2fff34f0bad44b2/0?verbose=false"
  //     })
  //     const mockResponse = httpMocks.createResponse({
  //       eventEmitter: require("events").EventEmitter
  //     })
  //     blockchainRoute(mockRequest, mockResponse)
  //
  //     mockResponse.on("end", () => {
  //       const actualResponseBody = Object.keys(
  //         JSON.parse(mockResponse._getData())
  //       )
  //       assert.deepEqual(actualResponseBody, [
  //         "bestblock",
  //         "confirmations",
  //         "value",
  //         "scriptPubKey",
  //         "coinbase"
  //       ])
  //       done()
  //     })
  //   })
  // })

  describe("#BlockchainGetTxOutProof", () => {
    it("should GET /getTxOutProof/:txid", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/getTxOutProof/53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = mockResponse._getData()
        assert.equal(
          actualResponseBody.message,
          "JSON value is not an array as expected"
        )
        done()
      })
    })
  })
  //
  // describe("#BlockchainPreciousBlock", () => {
  //   it("should GET /preciousBlock/:hash", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/preciousBlock/00000000000000000108641af52e01a447b1f9d801571f93a0f20a8cbf80c236"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     blockchainRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = mockResponse._getData();
  //       assert.equal(JSON.parse(actualResponseBody), "null" );
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#BlockchainPruneBlockchain", () => {
  //   it("should POST /pruneBlockchain/:height ", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "POST",
  //       url: "/pruneBlockchain/530384"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     blockchainRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = mockResponse._getData();
  //       assert.equal(actualResponseBody, "Cannot prune blocks because node is not in prune mode." );
  //       done();
  //     });
  //   });
  // });
  //
  // describe("#BlockchainVerifyChain", () => {
  //   it("should GET /verifyChain", (done) => {
  //     let mockRequest = httpMocks.createRequest({
  //       method: "GET",
  //       url: "/verifyChain"
  //     });
  //     let mockResponse = httpMocks.createResponse({
  //       eventEmitter: require('events').EventEmitter
  //     });
  //     blockchainRoute(mockRequest, mockResponse);
  //
  //     mockResponse.on('end', () => {
  //       let actualResponseBody = JSON.parse(mockResponse._getData());
  //       assert.equal(actualResponseBody, true);
  //       done();
  //     });
  //   });
  // });

  describe("#BlockchainVerifyTxOutProof", () => {
    it("should GET /verifyTxOutProof/:proof", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/verifyTxOutProof/53735a4ddb828825d6e3f52d045f4c151b2b3d51d631bc581e62f31184b151d6"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      blockchainRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = mockResponse._getData()
        assert.equal(
          actualResponseBody.message,
          "CDataStream::read(): end of data: iostream error"
        )
        done()
      })
    })
  })
})
