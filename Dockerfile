FROM python:3.12-slim

WORKDIR /sandbox

FROM python:3.12-slim

WORKDIR /sandbox

# Install necessary packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-venv \
    coreutils \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install the websocket-client library for Python globally
RUN pip install websocket-client

# Create a premade virtual environment with an upgraded pip at build time
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip

# Create a non-root user
RUN useradd -m sandbox

# Copy helper scripts with correct ownership
COPY --chown=sandbox:sandbox auto_install_python.sh /sandbox/
COPY --chown=root:root entrypoint.sh /sandbox/
RUN chmod +x /sandbox/auto_install_python.sh /sandbox/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/sandbox/entrypoint.sh"]

# Default command to keep the container alive
CMD ["tail", "-f", "/dev/null"]
