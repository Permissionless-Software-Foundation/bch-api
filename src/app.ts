"use strict"
import { Socket } from "net"

import * as express from "express"

// Middleware
import { routeRateLimit } from "./middleware/route-ratelimit"

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

const BitcoinCashZMQDecoder = require("bitcoincash-zmq-decoder")

const zmq = require("zeromq")

const sock: any = zmq.socket("sub")

const swStats = require("swagger-stats")
let apiSpec
if (process.env.NETWORK === "mainnet") {
  apiSpec = require("./public/bitcoin-com-mainnet-rest-v2.json")
} else {
  apiSpec = require("./public/bitcoin-com-testnet-rest-v2.json")
}

// v1
const indexV1 = require("./routes/v1/index")
const healthCheckV1 = require("./routes/v1/health-check")
const addressV1 = require("./routes/v1/address")
const blockV1 = require("./routes/v1/block")
const blockchainV1 = require("./routes/v1/blockchain")
const controlV1 = require("./routes/v1/control")
const generatingV1 = require("./routes/v1/generating")
const miningV1 = require("./routes/v1/mining")
const networkV1 = require("./routes/v1/network")
const rawtransactionsV1 = require("./routes/v1/rawtransactions")
const transactionV1 = require("./routes/v1/transaction")
const utilV1 = require("./routes/v1/util")
const dataRetrievalV1 = require("./routes/v1/dataRetrieval")
const payloadCreationV1 = require("./routes/v1/payloadCreation")
const slpV1 = require("./routes/v1/slp")

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

interface IError {
  message: string
  status: number
}

require("dotenv").config()

const app: express.Application = express()

app.locals.env = process.env

app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }))

app.use(helmet())

app.use(cors())
app.enable("trust proxy")

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

app.use("/public", express.static(`${__dirname}/public`))
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

interface ICustomRequest extends express.Request {
  io: any
}

// Make io accessible to our router
app.use(
  (req: ICustomRequest, res: express.Response, next: express.NextFunction) => {
    req.io = io

    next()
  }
)

const v1prefix = "v1"
const v2prefix = "v2"

app.use("/", indexV1)
app.use(`/${v1prefix}/` + `health-check`, healthCheckV1)
app.use(`/${v1prefix}/` + `address`, addressV1)
app.use(`/${v1prefix}/` + `blockchain`, blockchainV1)
app.use(`/${v1prefix}/` + `block`, blockV1)
app.use(`/${v1prefix}/` + `control`, controlV1)
app.use(`/${v1prefix}/` + `generating`, generatingV1)
app.use(`/${v1prefix}/` + `mining`, miningV1)
app.use(`/${v1prefix}/` + `network`, networkV1)
app.use(`/${v1prefix}/` + `rawtransactions`, rawtransactionsV1)
app.use(`/${v1prefix}/` + `transaction`, transactionV1)
app.use(`/${v1prefix}/` + `util`, utilV1)
app.use(`/${v1prefix}/` + `dataRetrieval`, dataRetrievalV1)
app.use(`/${v1prefix}/` + `payloadCreation`, payloadCreationV1)
app.use(`/${v1prefix}/` + `slp`, slpV1)

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
const auth = new AuthMW()
app.use(`/${v2prefix}/`, auth.mw())

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

// catch 404 and forward to error handler
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const err: IError = {
      message: "Not Found",
      status: 404
    }

    next(err)
  }
)

// error handler
app.use((err: IError, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
console.log(`rest.bitcoin.com started on port ${port}`)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)
const io = require("socket.io").listen(server)
io.on("connection", (socket: Socket) => {
  console.log("Socket Connected")

  socket.on("disconnect", () => {
    console.log("Socket Disconnected")
  })
})

/**
 * Setup ZMQ connections if ZMQ URL and port provided
 */

if (process.env.ZEROMQ_URL && process.env.ZEROMQ_PORT) {
  console.log(`Connecting to BCH ZMQ at ${process.env.ZEROMQ_URL}:${process.env.ZEROMQ_PORT}`)
  const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder(process.env.NETWORK)

  sock.connect(`tcp://${process.env.ZEROMQ_URL}:${process.env.ZEROMQ_PORT}`)
  sock.subscribe("raw")

  sock.on("message", (topic: any, message: string) => {
    try {
      const decoded = topic.toString("ascii")
      if (decoded === "rawtx") {
        const txd = bitcoincashZmqDecoder.decodeTransaction(message)
        io.emit("transactions", JSON.stringify(txd, null, 2))
      } else if (decoded === "rawblock") {
        const blck = bitcoincashZmqDecoder.decodeBlock(message)
        io.emit("blocks", JSON.stringify(blck, null, 2))
      }
    } catch (error) {
      const errorMessage = 'Error processing ZMQ message'
      console.log(errorMessage, error)
      wlogger.error(errorMessage, error)
    }
  })
} else {
  console.log("ZEROMQ_URL and ZEROMQ_PORT env vars missing. Skipping ZMQ connection.")
}

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

function normalizePort(val: string) {
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
function onError(error: any) {
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
