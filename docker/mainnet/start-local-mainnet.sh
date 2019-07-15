#!/bin/bash

# Harddrive Mainnet full node
export RPC_BASEURL=http://172.17.0.1:8332/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password
export ZEROMQ_PORT=28332
export ZEROMQ_URL=172.17.0.1
export NETWORK=mainnet

# Team DO QA Testnet Insight Server
export BITCOINCOM_BASEURL=http://172.17.0.1:12100/api/

# Testnet SLPDB
#export SLPDB_URL=https://slpdb.bchdata.cash/
export SLPDB_URL=http://172.17.0.1:4000/

# Testnet Bitcore Node API
export BITCORE_URL=http://172.17.0.1:12200/

# Testnet Blockbook
export BLOCKBOOK_URL=https://172.17.0.1:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

npm start
