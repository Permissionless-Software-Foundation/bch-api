# bch-api

[![Greenkeeper badge](https://badges.greenkeeper.io/christroutner/bch-api.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/christroutner/bch-api.svg?branch=master)](https://travis-ci.org/christroutner/bch-api)

This is a fork and alternative implementation of
the [rest.bitcoin.com](https://github.com/Bitcoin-com/rest.bitcoin.com) repository.
The purpose of this code is to create a REST API server that provides a common
interface for working with a Bitcoin Cash full node and various indexers.

This repository is intended to be paired with my alternative implementation
of [BITBOX SDK](https://github.com/Bitcoin-com/bitbox-sdk):
[bch-js](https://github.com/christroutner/bch-js), and is part of the product
offering at [bchjs.cash](https://bchjs.cash).

- [API Documentation](https://bchjs.cash/bch-api/index.html)
- Video: [Basic Concepts](https://www.youtube.com/watch?v=o0FfW5rZPFs)
- Video: [Application Stack](https://youtu.be/8w0CpQ8oydA)
- [bchjs.cash](https://bchjs.cash): Buy a turn-key REST API microserver.

Have questions? Need help? Join our community support
[Telegram channel](https://t.me/bch_js_toolkit)

## Features
The following features set this repository apart from rest.bitcoin.com:

- Address balance and UTXO queries for [Blockbook](https://github.com/trezor/blockbook) and [Bitcore](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-node) added.
- Rate limits are set to 10 RPM by default, and 60 RPM if Basic Authentiction header is used.
- Typescript removed and ES8 JavaScript used instead.
- npm audit run on all dependencies.
- [Greenkeeper](https://greenkeeper.io/) implemented for automatic dependency management
and security updates.

## Live Demo
You can test a live demo of the REST API by running the
[bch-js examples](https://github.com/christroutner/bch-js/tree/master/examples).
Rate limits are 10 requests per minute. This is fast enough to try out the examples
but these servers are not intended as a freemium service. You can run your own
REST server by purchasing the hard drive at [bchjs.cash](https://bchjs.cash).

- Mainnet REST API server: http://decatur.hopto.org:12400/v3/
  - Check server status: http://decatur.hopto.org:12401
- Testnet REST API server: http://decatur.hopto.org:13400/v3/
  - Check server status: http://decatur.hopto.org:13401

## Installation
There are two installation paths, depending if you want a *development* or
*production* environment. You'll also need to set up the underlying infrastructure
described [this page](https://bchjs.cash/bch-api-stack/).

This code targets the Ubuntu 18.04 LTS Linux OS.

### Development
This is a standard node.js project. The installation is as follows:

- Clone this repository:

`git clone https://github.com/christroutner/bch-api && cd bch-api`

- Install dependencies:

`npm install`

- Customize the [start-dev-example.sh](start-dev-example.sh) shell script to
point to the required infrastructure. Start the bch-api REST API by running
this script:

`./start-dev-example.sh`

### Production
For a production environment, a Docker container is provided in the
[docker](docker) directory. One for mainnet and one for testnet. Again, these
containers target the Ubuntu 18.04 LTS Linux OS.

- Install Docker and Docker Compose by following the commands on
[this Dev Ops page](https://troutsblog.com/research/dev-ops/overview).

- Customize the [bash script](docker/mainnet/start-local-mainnet.sh) for your
installation.

- Build the Docker container with:

`docker-compose build --no-cache`

- Run the Docker container with:

`docker-compose up`

## License
[MIT](LICENSE.md)
