'use strict'

const express = require('express')

// Middleware
// const { routeRateLimit } = require("./middleware/route-ratelimit")
const RateLimits = require('./middleware/route-ratelimit')
const rateLimits = new RateLimits()

const path = require('path')
const logger = require('morgan')
const wlogger = require('./util/winston-logging')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
// const basicAuth = require("express-basic-auth")
const helmet = require('helmet')
const debug = require('debug')('rest-cloud:server')
const http = require('http')
const cors = require('cors')

// Auth and rate limiting middleware libraries.
const AuthMW = require('./middleware/auth')
const jwtAuth = require('./middleware/jwt-auth')

// Logging for API requests.
const logReqInfo = require('./middleware/req-logging')

// v3
const healthCheckV3 = require('./routes/v3/health-check')
const BlockchainV3 = require('./routes/v3/full-node/blockchain')
const ControlV3 = require('./routes/v3/full-node/control')
const MiningV3 = require('./routes/v3/full-node/mining')
const networkV3 = require('./routes/v3/full-node/network')
const RawtransactionsV3 = require('./routes/v3/full-node/rawtransactions')
const utilV3 = require('./routes/v3/util')
const SlpV3 = require('./routes/v3/slp')
const xpubV3 = require('./routes/v3/xpub')
const BlockbookV3 = require('./routes/v3/blockbook')
const Ninsight = require('./routes/v3/ninsight')
const ElectrumXV3 = require('./routes/v3/electrumx')
const EncryptionV3 = require('./routes/v3/encryption')
const PriceV3 = require('./routes/v3/price')

// v4
const healthCheckV4 = require('./routes/v4/health-check')
const BlockchainV4 = require('./routes/v4/full-node/blockchain')
const ControlV4 = require('./routes/v4/full-node/control')
const MiningV4 = require('./routes/v4/full-node/mining')
const networkV4 = require('./routes/v4/full-node/network')
const RawtransactionsV4 = require('./routes/v4/full-node/rawtransactions')
const utilV4 = require('./routes/v4/util')
const SlpV4 = require('./routes/v4/slp')
const xpubV4 = require('./routes/v4/xpub')
const BlockbookV4 = require('./routes/v4/blockbook')
const ElectrumXV4 = require('./routes/v4/electrumx')
const EncryptionV4 = require('./routes/v4/encryption')
const PriceV4 = require('./routes/v4/price')

require('dotenv').config()

// Instantiate v3 route libraries.
const blockchainV3 = new BlockchainV3()
const controlV3 = new ControlV3()
const miningV3 = new MiningV3()
const rawtransactionsV3 = new RawtransactionsV3()
const slpV3 = new SlpV3()
const blockbookV3 = new BlockbookV3()
const electrumxv3 = new ElectrumXV3()
electrumxv3.connect()
const encryptionv3 = new EncryptionV3()
const pricev3 = new PriceV3()

// Instantiate v4 route libraries.
const blockchainV4 = new BlockchainV4()
const controlV4 = new ControlV4()
const miningV4 = new MiningV4()
const rawtransactionsV4 = new RawtransactionsV4()
const slpV4 = new SlpV4()
const blockbookV4 = new BlockbookV4()
const electrumxv4 = new ElectrumXV4()
electrumxv4.connect()
const encryptionv4 = new EncryptionV4()
const pricev4 = new PriceV4()

const app = express()

app.locals.env = process.env

// app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }))

app.use(helmet())

app.use(cors())
app.enable('trust proxy')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// Mount the docs
app.use('/docs', express.static(`${__dirname}/../docs`))

// Log each request to the console with IP addresses.
// app.use(logger("dev"))
const morganFormat =
  ':remote-addr :remote-user :method :url :status :response-time ms - :res[content-length] :user-agent'
app.use(logger(morganFormat))

// Log the same data to the winston logs.
const logStream = {
  write: function (message, encoding) {
    wlogger.info(`request: ${message}`)
  }
}
app.use(logger(morganFormat, { stream: logStream }))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Log requests for later analysis.
app.use('/', logReqInfo)

// const v2prefix = "v2"
const v3prefix = 'v3'
const v4prefix = 'v4'

// Inspect the header for a JWT token.
app.use(`/${v3prefix}/`, jwtAuth.getTokenFromHeaders)
app.use(`/${v4prefix}/`, jwtAuth.getTokenFromHeaders)

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
// Handles Anonymous and Basic Authorization schemes used by passport.js
const auth = new AuthMW()
app.use(`/${v3prefix}/`, auth.mw())
app.use(`/${v4prefix}/`, auth.mw())

// Rate limit on all v3 routes
// Establish and enforce rate limits.
// app.use(`/${v3prefix}/`, rateLimits.routeRateLimit)
app.use(`/${v3prefix}/`, rateLimits.rateLimitByResource)

// Rate limit on all v4 routes
// Establish and enforce rate limits.
app.use(`/${v4prefix}/`, rateLimits.rateLimitByResource)

// Connect v3 routes
app.use(`/${v3prefix}/` + 'health-check', healthCheckV3)
app.use(`/${v3prefix}/` + 'blockchain', blockchainV3.router)
app.use(`/${v3prefix}/` + 'control', controlV3.router)
app.use(`/${v3prefix}/` + 'mining', miningV3.router)
app.use(`/${v3prefix}/` + 'network', networkV3)
app.use(`/${v3prefix}/` + 'rawtransactions', rawtransactionsV3.router)
app.use(`/${v3prefix}/` + 'util', utilV3.router)
app.use(`/${v3prefix}/` + 'slp', slpV3.router)
app.use(`/${v3prefix}/` + 'xpub', xpubV3.router)
app.use(`/${v3prefix}/` + 'blockbook', blockbookV3.router)
app.use(`/${v3prefix}/` + 'electrumx', electrumxv3.router)
app.use(`/${v3prefix}/` + 'encryption', encryptionv3.router)
app.use(`/${v3prefix}/` + 'price', pricev3.router)

// Connect v4 routes
app.use(`/${v4prefix}/` + 'health-check', healthCheckV4)
app.use(`/${v4prefix}/` + 'blockchain', blockchainV4.router)
app.use(`/${v4prefix}/` + 'control', controlV4.router)
app.use(`/${v4prefix}/` + 'mining', miningV4.router)
app.use(`/${v4prefix}/` + 'network', networkV4)
app.use(`/${v4prefix}/` + 'rawtransactions', rawtransactionsV4.router)
app.use(`/${v4prefix}/` + 'util', utilV4.router)
app.use(`/${v4prefix}/` + 'slp', slpV4.router)
app.use(`/${v4prefix}/` + 'xpub', xpubV4.router)
app.use(`/${v4prefix}/` + 'blockbook', blockbookV4.router)
app.use(`/${v4prefix}/` + 'electrumx', electrumxv4.router)
app.use(`/${v4prefix}/` + 'encryption', encryptionv4.router)
app.use(`/${v4prefix}/` + 'price', pricev4.router)

const ninsight = new Ninsight()
app.use(`/${v3prefix}/` + 'ninsight', ninsight.router)
app.use(`/${v4prefix}/` + 'ninsight', ninsight.router)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = {
    message: 'Not Found',
    status: 404
  }

  next(err)
})

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500

  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

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
const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)
console.log(`bch-api started on port ${port}`)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors. Is 10 seconds too agressive?
server.setTimeout(30 * 1000)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
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
function onError (error) {
  if (error.syscall !== 'listen') throw error

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      // break
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`)
      process.exit(1)
      // break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening () {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}
//
// module.exports = app;
