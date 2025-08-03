#!/bin/bash
set -e

echo "Starting Ollama server..."

# Start Ollama server in background
ollama serve &

# Wait for server to be ready
echo "Waiting for Ollama server to start..."
while ! curl -s http://localhost:11434/api/version > /dev/null; do
    echo "Waiting for Ollama server..."
    sleep 2
done

echo "Ollama server is ready!"

# Pull phi4-mini model
echo "Pulling phi4-mini model..."
ollama pull phi4-mini

echo "Model pulled successfully!"

# Keep the container running
wait
