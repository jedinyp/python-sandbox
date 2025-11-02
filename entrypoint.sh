#!/bin/sh

set -e

VENV_PATH="/packages/venv"
TEMPLATE_VENV_PATH="/opt/venv"

# Copy premade venv if volume does not have one
if [ ! -f "$VENV_PATH/bin/python" ]; then
    echo "Virtual environment not found. Copying pre-warmed venv..."
    cp -r "$TEMPLATE_VENV_PATH" "$VENV_PATH"
fi
chown -R sandbox:sandbox /packages

# Execute the CMD passed from the Dockerfile
exec "$@"

