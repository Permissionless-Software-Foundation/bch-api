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

# Mainnet Fulcrum / ElectrumX
export FULCRUM_URL=192.168.0.6
export FULCRUM_PORT=50002

export TOKENSECRET=somelongpassword

# So that bch-api can call bch-js locally.
export LOCAL_RESTURL=http://127.0.0.1:3000/v3/

# slp-api alternative SLP validator.
export SLP_API_URL=http://10.0.0.5:5001/

# Basic Authentication password
export PRO_PASS=somerandomepassword:someotherrandompassword:aThirdPassword

npm start
