#!/bin/sh
set -e

# This entrypoint script ensures the data directory has correct permissions
# before starting the application. It runs as root initially, fixes permissions,
# then switches to the nextjs user.

DATA_DIR="/app/data"
NEXTJS_USER="nextjs"
NEXTJS_UID=1001
NEXTJS_GID=1001

# Ensure the data directory exists
mkdir -p "$DATA_DIR"

# Fix ownership of the data directory if running as root
if [ "$(id -u)" = "0" ]; then
    # Change ownership of the data directory to nextjs user
    chown -R "$NEXTJS_UID:$NEXTJS_GID" "$DATA_DIR"
    
    # Execute the command as the nextjs user using gosu (Debian equivalent of su-exec)
    # Set HOME to /tmp so Next.js can create cache directories
    exec gosu "$NEXTJS_USER" env HOME=/tmp "$@"
else
    # Already running as non-root, just execute the command
    exec "$@"
fi
