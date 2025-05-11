#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

# Install production dependencies
echo "Installing production dependencies..."
npm ci --production

# Start the server using PM2
echo "Starting server with PM2..."
pm2 start server/server.js --name "nisapoti-admin" --env production

echo "Deployment completed!" 