#!/bin/bash

# Restart environment script

echo "Stopping all node processes..."
taskkill //F //IM node.exe //T 2>/dev/null || echo "No node processes found."

echo "Cleaning up sessions and temporary files..."
rm -rf tmp_* 2>/dev/null

echo "Starting development environment..."
npm run dev
