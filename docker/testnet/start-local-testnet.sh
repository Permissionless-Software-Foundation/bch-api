#!/bin/bash

# Full node
export RPC_BASEURL=http://172.17.0.1:18332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export NETWORK=testnet

# SLPDB
export SLPDB_URL=http://172.17.0.1:13300/

# Blockbook Indexer
export BLOCKBOOK_URL=https://172.17.0.1:19131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Redis DB
export REDIS_PORT=6380
export REDIS_HOST=172.17.0.1

# JWT Token Secret
export TOKENSECRET=somelongsecretvalue

npm start
