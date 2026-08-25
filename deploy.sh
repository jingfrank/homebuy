#!/bin/bash
cd /home/ubuntu/homebuy && git fetch origin master && git reset --hard origin/master && npm run build && pm2 restart prediction-api
