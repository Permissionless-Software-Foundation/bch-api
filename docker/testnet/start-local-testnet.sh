#!/bin/bash

# Docker containers for the below infrastructure is described here:
# https://psfoundation.cash/blog/cash-stack
# Pre-synced databases can be downloaded on the CashStrap page:
# https://fullstack.cash/cashstrap

# Which network are you using?
#export NETWORK=mainnet
export NETWORK=testnet

# Full node
export RPC_IP=172.17.0.1:18332
export RPC_BASEURL=http://$RPC_IP/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password

# SLPDB
export SLPDB_URL=http://172.17.0.1:13300/
export SLPDB_PASS=portlandisacityinoregon
export SLPDB_PASS_GP=portlandisacityinoregon
export SLPDB_PASS_WL=portlandisacityinoregon
# Use the same address as SLPDB_URL if you don't have a separate whitelist server.
export SLPDB_WHITELIST_URL=http://172.17.0.1:13300/
# slp-api alternative SLP validator using slp-validate:
# https://github.com/Permissionless-Software-Foundation/slp-api
export SLP_API_URL=https://slpapi-testnet3.fullstackslp.nl/

# Mainnet Fulcrum / ElectrumX
export FULCRUM_URL=172.17.0.1
export FULCRUM_PORT=60002
export FULCRUM_API=http://172.17.0.1:3000/v1/

# Redis DB
export REDIS_PORT=6380
export REDIS_HOST=172.17.0.1

# JWT Token Secret
export TOKENSECRET=fridayharbor

# So that bch-api can call bch-js locally.
export LOCAL_RESTURL=http://127.0.0.1:3000/v4/

# Basic Authentication password (optional)
export PRO_PASS=thejaasjhehrakseuhakuhr

# Whitelisted domains. Automatically give pro-tier rate limit access to apps
# that originate froma domain on the whitelist.
export WHITELIST_DOMAINS=fullstack.cash,psfoundation.cash,torlist.cash

# Rate Limits. Numbers are divided into 1000. e.g. 1000 / 50 = 20 RPM for ANON.
# Requests use the ANON rate limit if they fail to pass in a JWT token.
# ANON = 20 requests per minute (RPM)
export ANON_RATE_LIMIT=50
# 10 = 100 RPM
export WHITELIST_RATE_LIMIT=1

export INTERNAL_RATE_LIMIT=100

npm start

