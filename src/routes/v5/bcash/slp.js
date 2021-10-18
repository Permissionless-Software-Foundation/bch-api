/*
  Electrum API route
*/

"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const util = require("util");
// const bitcore = require('bitcore-lib-cash')

// const ElectrumCash = require('electrum-cash').ElectrumClient
// const ElectrumCash = require('/home/trout/work/personal/electrum-cash/electrum.js').Client // eslint-disable-line

const wlogger = require("../../../util/winston-logging");
const config = require("../../../../config");

const RouteUtils = require("../../../util/route-utils");
const routeUtils = new RouteUtils();

// const BCHJS = require("@psf/bch-js");
// const bchjs = new BCHJS();

let _this;

class BcashSlp {
  constructor() {
    this.config = config;
    this.axios = axios;
    this.routeUtils = routeUtils;
    // this.bchjs = bchjs;
    // _this.bitcore = bitcore

    this.bcashServer = process.env.BCASH_SERVER;
    if (!this.bcashServer) {
      // console.warn('FULCRUM_API env var not set. Can not connect to Fulcrum indexer.')
      throw new Error(
        "BCASH_SERVER env var not set. Can not connect to bcash full node."
      );
    }

    this.router = router;
    this.router.get("/", this.root);
  }

  // DRY error handler.
  errorHandler(err, res) {
    // Attempt to decode the error message.
    const { msg, status } = _this.routeUtils.decodeError(err);
    // console.log('errorHandler msg: ', msg)
    // console.log('errorHandler status: ', status)

    if (msg) {
      res.status(status);
      return res.json({ success: false, error: msg });
    }

    // Handle error patterns specific to this route.
    if (err.message) {
      res.status(400);
      return res.json({ success: false, error: err.message });
    }

    // If error can be handled, return the stack trace
    res.status(500);
    return res.json({ error: util.inspect(err) });
  }

  // Root API endpoint. Simply acknowledges that it exists.
  root(req, res, next) {
    return res.json({ status: "bcash-slp" });
  }
}

module.exports = BcashSlp;
