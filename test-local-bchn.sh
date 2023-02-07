#!/bin/bash

# Connect to cloud infrastructure and run integration tests.

export NETWORK=mainnet

# mainnet full node
export RPC_IP=172.17.0.1:8332
export RPC_BASEURL=http://$RPC_IP/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password

# Mainnet Fulcrum / ElectrumX
export FULCRUM_API=http://172.17.0.1:3001/v1/

# psf-slp-indxer
export SLP_INDEXER_API=http://172.17.0.1:5021/

# Redis DB - Used for rate limiting - customize to your own Redis installation.
export REDIS_PORT=6379
#export REDIS_HOST=172.17.0.1
export REDIS_HOST=127.0.0.1

# JWT Token Secret
# This is used to verify JWT tokens generated with jwt-bch-api:
# https://github.com/Permissionless-Software-Foundation/jwt-bch-api
export TOKENSECRET=somelongpassword

# So that bch-api can call bch-js locally.
#export LOCAL_RESTURL=http://127.0.0.1:3000/v5/
export LOCAL_RESTURL=https://bchn.fullstack.cash/v5/

# Basic Authentication password
export PRO_PASS=somerandomepassword:someotherrandompassword:aThirdPassword

# Uncomment the line below if you do not want to use rate limits
export DO_NOT_USE_RATE_LIMITS=1

export TEST=integration

export ISBCHN=true

npm run test

# mocha --timeout 15000 -g '#getBlock()' --exit test/v4/

#export NETWORK=mainnet
#mocha --timeout 25000 test/v3/electrumx.js
