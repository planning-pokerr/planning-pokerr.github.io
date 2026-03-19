#!/bin/bash
export PATH="/Users/shivang.sharma/.nvm/versions/node/v22.19.0/bin:$PATH"
cd /Users/shivang.sharma/repos/Developer/work/pokerplanning/packages/web
exec /Users/shivang.sharma/.nvm/versions/node/v22.19.0/bin/node \
  /Users/shivang.sharma/repos/Developer/work/pokerplanning/packages/web/node_modules/.bin/vite \
  --port 5173 --host
