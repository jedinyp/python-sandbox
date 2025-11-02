# python-sandbox

A secure, session-based web sandbox for executing Python code. This application provides each user with a dedicated, isolated Docker container that persists for their browser session.

## Features

- Each user session is assigned a dedicated Docker container that runs until the browser tab is closed.
- If your code imports a package that is not available, the sandbox automatically installs it from PyPI using a secure, isolated process.
- Code output is streamed directly from the container to the browser in real-time using WebSockets.

## Architecture Overview

1.  Next.js Frontend
2.  Node.js Backend (router and websockets server)
3.  Dockerized Python Sandbox

## Getting Started

### Prerequisites

- [Node.js]
- [Docker]

### Development Setup

1.  **Install Project Dependencies**
    ```bash
    npm install
    ```

2.  **Build the Docker Image**
    This command builds the secure sandbox environment.
    ```bash
    docker build -t python-sandbox-image .
    ```

3.  **Run the Development Server**
    This starts the Next.js frontend and the WebSocket server.
    ```bash
    npm run dev
    ```

### Production Deployment

**On Linux or macOS**
```bash
./run.sh
```

**On Windows**
```bat
.\run.bat
```
