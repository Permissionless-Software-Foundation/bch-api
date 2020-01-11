#!/bin/bash

# Full node
export RPC_BASEURL=http://<full node ip>:8332/
export RPC_USERNAME=<RPC username>
export RPC_PASSWORD=<RPC password>
export NETWORK=mainnet

# SLPDB
export SLPDB_URL=http://<SLPDB IP>:12300/

# Blockbook
export BLOCKBOOK_URL=https://<Blockbook IP>:9131/
# Allow node.js to make network calls to https using self-signed certificate.
export NODE_TLS_REJECT_UNAUTHORIZED=0

npm start
