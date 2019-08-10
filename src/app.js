"use strict"

const express = require("express")

// Middleware
const { routeRateLimit } = require("./middleware/route-ratelimit")

const path = require("path")
const logger = require("morgan")
const wlogger = require("./util/winston-logging")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const basicAuth = require("express-basic-auth")
const helmet = require("helmet")
const debug = require("debug")("rest-cloud:server")
const http = require("http")
const cors = require("cors")
const AuthMW = require("./middleware/auth")

// v2
const indexV2 = require("./routes/v2/index")
const healthCheckV2 = require("./routes/v2/health-check")
const addressV2 = require("./routes/v2/address")
const blockV2 = require("./routes/v2/block")
const blockchainV2 = require("./routes/v2/blockchain")
const controlV2 = require("./routes/v2/control")
const generatingV2 = require("./routes/v2/generating")
const miningV2 = require("./routes/v2/mining")
const networkV2 = require("./routes/v2/network")
const rawtransactionsV2 = require("./routes/v2/rawtransactions")
const transactionV2 = require("./routes/v2/transaction")
const utilV2 = require("./routes/v2/util")
const slpV2 = require("./routes/v2/slp")

// v3
const healthCheckV3 = require("./routes/v3/health-check")
const blockchainV3 = require("./routes/v3/blockchain")
const controlV3 = require("./routes/v3/control")
const miningV3 = require("./routes/v3/mining")
const networkV3 = require("./routes/v3/network")
const rawtransactionsV3 = require("./routes/v3/rawtransactions")
const utilV3 = require("./routes/v3/util")
const slpV3 = require("./routes/v3/slp")
const xpubV3 = require("./routes/v3/xpub")
const bitcoreV3 = require("./routes/v3/bitcore")
const blockbookV3 = require("./routes/v3/blockbook")
const insightV3 = require("./routes/v3/insight")
const insightBlockV3 = require("./routes/v3/insight/block")
const insightTranactionV3 = require("./routes/v3/insight/transaction")
const insightAddressV3 = require("./routes/v3/insight/address")

require("dotenv").config()

const app = express()

app.locals.env = process.env

//app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }))

app.use(helmet())

app.use(cors())
app.enable("trust proxy")

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

// Mount the docs
app.use("/docs", express.static(`${__dirname}/../docs`))

app.use(logger("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

//
// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;
//
// app.use(basicAuth(
//   {
//     users: { username: password }
//   }
// ));

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io

  next()
})

const v2prefix = "v2"
const v3prefix = "v3"

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
const auth = new AuthMW()
app.use(`/${v2prefix}/`, auth.mw())
app.use(`/${v3prefix}/`, auth.mw())

// Rate limit on all v2 routes
app.use(`/${v2prefix}/`, routeRateLimit)
app.use("/", indexV2)
app.use(`/${v2prefix}/` + `health-check`, healthCheckV2)
app.use(`/${v2prefix}/` + `address`, addressV2.router)
app.use(`/${v2prefix}/` + `blockchain`, blockchainV2.router)
app.use(`/${v2prefix}/` + `block`, blockV2.router)
app.use(`/${v2prefix}/` + `control`, controlV2.router)
app.use(`/${v2prefix}/` + `generating`, generatingV2)
app.use(`/${v2prefix}/` + `mining`, miningV2.router)
app.use(`/${v2prefix}/` + `network`, networkV2)
app.use(`/${v2prefix}/` + `rawtransactions`, rawtransactionsV2.router)
app.use(`/${v2prefix}/` + `transaction`, transactionV2.router)
app.use(`/${v2prefix}/` + `util`, utilV2.router)
app.use(`/${v2prefix}/` + `slp`, slpV2.router)

// Rate limit on all v3 routes
app.use(`/${v3prefix}/`, routeRateLimit)
app.use(`/${v3prefix}/` + `health-check`, healthCheckV3)
app.use(`/${v3prefix}/` + `blockchain`, blockchainV3.router)
app.use(`/${v3prefix}/` + `control`, controlV3.router)
app.use(`/${v3prefix}/` + `mining`, miningV3.router)
app.use(`/${v3prefix}/` + `network`, networkV3)
app.use(`/${v3prefix}/` + `rawtransactions`, rawtransactionsV3.router)
app.use(`/${v3prefix}/` + `util`, utilV3.router)
app.use(`/${v3prefix}/` + `slp`, slpV3.router)
app.use(`/${v3prefix}/` + `xpub`, xpubV3.router)
app.use(`/${v3prefix}/` + `bitcore`, bitcoreV3.router)
app.use(`/${v3prefix}/` + `blockbook`, blockbookV3.router)
app.use(`/${v3prefix}/` + `insight`, insightV3.router)
app.use(`/${v3prefix}/` + `insight/block`, insightBlockV3.router)
app.use(`/${v3prefix}/` + `insight/transaction`, insightTranactionV3.router)
app.use(`/${v3prefix}/` + `insight/address`, insightAddressV3.router)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = {
    message: "Not Found",
    status: 404
  }

  next(err)
})

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500

  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get("env") === "development" ? err : {}

  // render the error page
  res.status(status)
  res.json({
    status: status,
    message: err.message
  })
})

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000")
app.set("port", port)
console.log(`bch-api started on port ${port}`)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on("error", onError)
server.on("listening", onListening)

// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors. Is 10 seconds too agressive?
server.setTimeout(30 * 1000)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") throw error

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case "EADDRINUSE":
      console.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}
//
// module.exports = app;
