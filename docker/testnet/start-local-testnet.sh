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

# Mainnet Fulcrum / ElectrumX
export FULCRUM_URL=172.17.0.1
export FULCRUM_PORT=50002

# Redis DB
export REDIS_PORT=6380
export REDIS_HOST=172.17.0.1

# JWT Token Secret
export TOKENSECRET=somelongsecretvalue

# So that bch-api can call bch-js locally.
export LOCAL_RESTURL=http://127.0.0.1:3000/v3/

# slp-api alternative SLP validator.
export SLP_API_URL=http://10.0.0.5:5001/

npm start
