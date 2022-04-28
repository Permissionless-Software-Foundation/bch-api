#!/bin/bash

# Docker containers for the below infrastructure is described here:
# https://CashStack.info
# Pre-synced databases can be downloaded on the CashStrap page:
# https://fullstack.cash/cashstrap

# Which network are you using?
export NETWORK=mainnet
#export NETWORK=testnet

# Full node
export RPC_IP=<ip>:8332
export RPC_BASEURL=http://$RPC_IP/
export RPC_USERNAME=bitcoin
export RPC_PASSWORD=password

# (optional) If load-balancing multiple full nodes, it's best to pick a single
# one for broadcasting transactions to the network. Prevents accidental
# double spends.
#export RPC_SENDURL=http://$RPC_IP/

# psf-slp-indxer
export SLP_INDEXER_API=http://<ip>:<port>/

# Mainnet Fulcrum / ElectrumX
export FULCRUM_API=http://172.17.0.1:3001/v1/

# Redis DB - Used for rate limiting - customize to your own Redis installation.
export REDIS_PORT=6379
export REDIS_HOST=172.17.0.1

# JWT Token Secret
# This is used to verify JWT tokens generated with jwt-bch-api:
# https://github.com/Permissionless-Software-Foundation/jwt-bch-api
export TOKENSECRET=somelongpassword

# So that bch-api can call bch-js locally.
export LOCAL_RESTURL=http://127.0.0.1:3000/v5/

# Basic Authentication password
export PRO_PASS=somerandomepassword:someotherrandompassword:aThirdPassword

# Whitelisted domains. Automatically give pro-tier rate limit access to apps
# that originate froma domain on the whitelist.
export WHITELIST_DOMAINS=fullstack.cash,psfoundation.cash,torlist.cash

# Uncomment the line below if you do not want to use rate limits
#export export DO_NOT_USE_RATE_LIMITS=1
# Rate Limits. Numbers are divided into 1000. e.g. 10000 / 500 = 20 RPM for ANON.
# Requests use the ANON rate limit if they fail to pass in a JWT token.
# ANON = 20 requests per minute (RPM)
export ANON_RATE_LIMIT=500
# 10 = 1000 RPM
export WHITELIST_RATE_LIMIT=100

# Set logging parameters
#1m means no more than 1 megabyte
export LOG_MAX_SIZE=1m
#5d means store no more than 5 days
export LOG_MAX_FILES=5d

# (Optional) if using a bcash node, set this variable. Otherwise leave it as-is.
export BCASH_SERVER=http://localhost

# PSF SLP indexer
export SLP_INDEXER_API=https://psf-slp-indexer.fullstack.cash/

npm start
