#!/bin/bash

# Full node
export RPC_BASEURL=http://142.93.13.2:8332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export NETWORK=mainnet

# SLPDB
#export SLPDB_URL=https://slpdb.bitcoin.com/
#export SLPDB_URL=http://172.17.0.1:12300/
export SLPDB_URL=https://slpdb2.bchtest.net/
export SLPDB_PASS=owmvgnsksoapwhrnvu

# Blockbook Indexer
export BLOCKBOOK_URL=https://157.230.214.175:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

export JWT_AUTH_SERVER=http://172.17.0.1:5001/

# Redis DB
export REDIS_PORT=6379
export REDIS_HOST=172.17.0.1

npm start
