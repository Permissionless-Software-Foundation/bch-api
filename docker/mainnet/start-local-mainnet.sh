#!/bin/bash

# Full node
export RPC_BASEURL=http://172.17.0.1:8332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export ZEROMQ_PORT=28332
export ZEROMQ_URL=172.17.0.1
export NETWORK=mainnet

# SLPDB
#export SLPDB_URL=https://slpdb.bitcoin.com/
export SLPDB_URL=http://172.17.0.1:12300/

# Blockbook Indexer
export BLOCKBOOK_URL=https://172.17.0.1:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

npm start
