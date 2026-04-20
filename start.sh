#!/bin/bash

mkdir -p /tmp/mongodb-data

if ! pgrep -x mongod > /dev/null; then
  echo "Starting MongoDB..."
  mongod --dbpath /tmp/mongodb-data --fork --logpath /tmp/mongodb.log --bind_ip 127.0.0.1
  sleep 2
  echo "MongoDB started."
else
  echo "MongoDB already running."
fi

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

wait $FRONTEND_PID $BACKEND_PID
