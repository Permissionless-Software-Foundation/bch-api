'use strict'

const express = require('express')

// Middleware
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

// v5
const healthCheckV5 = require('./routes/v5/health-check')
const BlockchainV5 = require('./routes/v5/full-node/blockchain')
const ControlV5 = require('./routes/v5/full-node/control')
const MiningV5 = require('./routes/v5/full-node/mining')
const networkV5 = require('./routes/v5/full-node/network')
const RawtransactionsV5 = require('./routes/v5/full-node/rawtransactions')
const DSProofV5 = require('./routes/v5/full-node/dsproof')
const UtilV5 = require('./routes/v5/util')
const SlpV5 = require('./routes/v5/slp')
const xpubV5 = require('./routes/v5/xpub')
const ElectrumXV5 = require('./routes/v5/electrumx')
const EncryptionV5 = require('./routes/v5/encryption')
const PriceV5 = require('./routes/v5/price')
const JWTV5 = require('./routes/v5/jwt')
const BcashSLP = require('./routes/v5/bcash/slp')
const PsfSlpIndexer = require('./routes/v5/psf-slp-indexer')

require('dotenv').config()

// Instantiate v5 route libraries.
const blockchainV5 = new BlockchainV5()
const controlV5 = new ControlV5()
const miningV5 = new MiningV5()
const rawtransactionsV5 = new RawtransactionsV5()
const slpV5 = new SlpV5()
const electrumxv5 = new ElectrumXV5()
const encryptionv5 = new EncryptionV5()
const pricev5 = new PriceV5()
const utilV5 = new UtilV5({ electrumx: electrumxv5 })
const dsproofV5 = new DSProofV5()
const jwtV5 = new JWTV5()
const bcashSLP = new BcashSLP()
const psfSlpIndexer = new PsfSlpIndexer()
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
app.use('/docs', express.static(`${__dirname.toString()}/../docs`))

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

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Log requests for later analysis.
app.use('/', logReqInfo)

const v5prefix = 'v5'

// START Rate Limits
const auth = new AuthMW()

// Ensure req.locals and res.locals objects exist.
app.use(`/${v5prefix}/`, rateLimits.populateLocals)

// Allow users to turn off rate limits with an environment variable.
const DO_NOT_USE_RATE_LIMITS = process.env.DO_NOT_USE_RATE_LIMITS || false

console.log(`DO_NOT_USE_RATE_LIMITS: ${DO_NOT_USE_RATE_LIMITS}`)

if (!DO_NOT_USE_RATE_LIMITS) {
  console.log('Rate limits are being used')
  // Inspect the header for a JWT token.
  app.use(`/${v5prefix}/`, jwtAuth.getTokenFromHeaders)

  // Instantiate the authorization middleware, used to implement pro-tier rate limiting.
  // Handles Anonymous and Basic Authorization schemes used by passport.js
  app.use(`/${v5prefix}/`, auth.mw())

  // Experimental rate limits
  app.use(`/${v5prefix}/`, rateLimits.applyRateLimits)

// Rate limit on all v4 routes
// Establish and enforce rate limits.
// app.use(`/${v4prefix}/`, rateLimits.rateLimitByResource)
} else {
  console.log('Rate limits are NOT being used')
}
// END Rate Limits

// Connect v5 routes
app.use(`/${v5prefix}/` + 'health-check', healthCheckV5)
app.use(`/${v5prefix}/` + 'blockchain', blockchainV5.router)
app.use(`/${v5prefix}/` + 'control', controlV5.router)
app.use(`/${v5prefix}/` + 'mining', miningV5.router)
app.use(`/${v5prefix}/` + 'network', networkV5)
app.use(`/${v5prefix}/` + 'rawtransactions', rawtransactionsV5.router)
app.use(`/${v5prefix}/` + 'slp', slpV5.router)
app.use(`/${v5prefix}/` + 'xpub', xpubV5.router)
app.use(`/${v5prefix}/` + 'electrumx', electrumxv5.router)
app.use(`/${v5prefix}/` + 'encryption', encryptionv5.router)
app.use(`/${v5prefix}/` + 'price', pricev5.router)
app.use(`/${v5prefix}/` + 'util', utilV5.router)
app.use(`/${v5prefix}/` + 'dsproof', dsproofV5.router)
app.use(`/${v5prefix}/` + 'jwt', jwtV5.router)

app.use(`/${v5prefix}/` + 'bcash/slp', bcashSLP.router)

app.use(`/${v5prefix}/` + 'psf/slp', psfSlpIndexer.router)

// Daniel:
// app.use(`/${v5prefix}/` + 'psfslp', psfSlp.router)

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

// Set the time before a timeout error is generated.
// 10 seconds is way too agressive. 30 Seconds was used for a while, but with
// being able to set a timeout between UTXOs for tokenUtxoDetails, the timeout
// needed to be extended.
server.setTimeout(1000 * 60 * 5) // 5 minutes

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
      break
    case 'EADDRINUSE':
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

function onListening () {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}
//
// module.exports = app
