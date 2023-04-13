#!/bin/bash

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

npm install

echo "Starting the application..."

npm start