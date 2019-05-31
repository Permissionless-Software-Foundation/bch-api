"use strict"

const express = require("express")
const router = express.Router()

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ status: "winning v2" })
})

module.exports = router
