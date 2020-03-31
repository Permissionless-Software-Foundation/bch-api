#!/bin/bash

# test

# Full node
export RPC_BASEURL=http://172.17.0.1:8332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export NETWORK=mainnet

# SLPDB
export SLPDB_URL=http://172.17.0.1:12300/
export SLPDB_PASS=somelongpassword

# Blockbook Indexer
export BLOCKBOOK_URL=https://172.17.0.1:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

export JWT_AUTH_SERVER=http://172.17.0.1:5001/

# Redis DB
export REDIS_PORT=6379
export REDIS_HOST=172.17.0.1

npm start
