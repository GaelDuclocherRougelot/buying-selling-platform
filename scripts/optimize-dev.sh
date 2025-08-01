#!/bin/bash

# Script to optimize Next.js development environment
# Run this script when you experience slow filesystem issues

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf .turbo

echo "📦 Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "🔄 Reinstalling dependencies..."
npm install

echo "🚀 Starting development server..."
npm run dev 