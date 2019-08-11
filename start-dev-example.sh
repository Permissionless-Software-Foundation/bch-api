#!/bin/bash

# Harddrive Mainnet full node
export RPC_BASEURL=http://<full node ip>:8332/
export RPC_USERNAME=<RPC username>
export RPC_PASSWORD=<RPC password>
export NETWORK=mainnet

# Team DO QA Testnet Insight Server
export BITCOINCOM_BASEURL=http://<Insight API IP>:12100/api/

# Testnet SLPDB
export SLPDB_URL=http://<SLPDB IP>:12300/

# Testnet Bitcore Node API
export BITCORE_URL=http://<Bitcore Node IP>:12200/

# Testnet Blockbook
export BLOCKBOOK_URL=https://<Blockbook IP>:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

npm start
