#!/bin/bash

# Adapted from:
# https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04

# Install Redis.
sudo apt install redis-server

# Converting to systemd managed process
#echo "supervised systemd" >> /etc/redis/redis.conf

#sudo systemctl restart redis.service
