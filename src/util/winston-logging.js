/*
  Instantiates and configures the Winston logging library. This utitlity library
  can be called by other parts of the application to conveniently tap into the
  logging library.
*/

'use strict'

var winston = require('winston')
require('winston-daily-rotate-file')

var NETWORK = process.env.NETWORK

// Default 1 Megabyte
var LOG_MAX_SIZE = process.env.LOG_MAX_SIZE ? process.env.LOG_MAX_SIZE : '1m'

// Default 5 days.
// This was causing a problem with popularity. Creating over a gigabyte of files.
// var LOG_MAX_FILES = process.env.LOG_MAX_FILES ? process.env.LOG_MAX_FILES : '5d'

// 250 files @ 1Meg each = 250 megs
var LOG_MAX_FILES = process.env.LOG_MAX_FILES ? process.env.LOG_MAX_FILES : '250'

// Configure daily-rotation transport.
var transport = new winston.transports.DailyRotateFile({
  filename: `${__dirname}/../../logs/rest-${NETWORK}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

transport.on('rotate', function (oldFilename, newFilename) {
  wlogger.info('Rotating log files')
})

// This controls what goes into the log FILES
var wlogger = winston.createLogger({
  level: 'verbose',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' })
    transport
  ]
})

// This controls the logs to CONSOLE
/*
wlogger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
    level: 'info'
  })
)
*/

module.exports = wlogger
