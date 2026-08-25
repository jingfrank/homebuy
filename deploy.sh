#!/bin/bash
cd /home/ubuntu/homebuy && git pull origin master && npm run build && pm2 restart prediction-api
