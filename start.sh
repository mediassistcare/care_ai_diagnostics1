#!/bin/bash

# Start script for Care AI Diagnostics
echo "Starting Care AI Diagnostics..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
fi

# Start the application with Gunicorn
gunicorn --config gunicorn.conf.py app:app