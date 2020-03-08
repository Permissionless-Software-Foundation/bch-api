#!/bin/bash

# Full node
export RPC_BASEURL=http://206.189.188.192:18332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export NETWORK=testnet

# SLPDB
export SLPDB_URL=https://tslpdb.bitcoin.com/
#export SLPDB_URL=http://172.17.0.1:12300/

# Blockbook Indexer
export BLOCKBOOK_URL=https://157.230.178.198:19131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

export JWT_AUTH_SERVER=http://172.17.0.1:5001/

# Redis DB
export REDIS_PORT=6380
export REDIS_HOST=172.17.0.1

npm start
