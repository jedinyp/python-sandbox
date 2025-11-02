#!/bin/bash

CODE="$1"
SOCKET_ID="$2"
VENV_PATH="/packages/venv"
PYTHON_EXEC="$VENV_PATH/bin/python3"
WEBSOCKET_URL="ws://host.docker.internal:8080"

# Python script to send messages back to the WebSocket server
read -r -d '' SEND_WEBSOCKET_MESSAGE_PY << EOM
import sys
import websocket
import json

def send_message(socket_id, payload_str):
    try:
        ws = websocket.create_connection("$WEBSOCKET_URL")
        # The payload is already a JSON string, just add the socketId
        payload = json.loads(payload_str)
        payload["socketId"] = socket_id
        ws.send(json.dumps(payload))
        ws.close()
    except Exception as e:
        print(f"WebSocket connection failed: {e}", file=sys.stderr)

if __name__ == "__main__":
    socket_id, payload_str = sys.argv[1], sys.argv[2]
    send_message(socket_id, payload_str)
EOM

# Helper function to send output back to the browser, with a newline
send_output() {
    output_content=$(printf "%s\n" "$1")
    json_payload=$(printf '{"output": %s}' "$(jq -sR . <<< "$output_content")")
    python3 -c "$SEND_WEBSOCKET_MESSAGE_PY" "$SOCKET_ID" "$json_payload"
}

# Helper function to send the final message with the exit code
send_done() {
    json_payload=$(printf '{"done": true, "exitCode": %s}' "$1")
    python3 -c "$SEND_WEBSOCKET_MESSAGE_PY" "$SOCKET_ID" "$json_payload"
}

main() {
    OUTPUT=$("$PYTHON_EXEC" -c "$CODE" 2>&1)
    EXIT_CODE=$?

    # If a module is missing, install it
    if [[ $EXIT_CODE -ne 0 && "$OUTPUT" == *"ModuleNotFoundError"* ]]; then
        send_output "$OUTPUT"
        PACKAGE=$(echo "$OUTPUT" | grep "ModuleNotFoundError" | sed -n "s/.*No module named '\([^']*\)'.*/\1/p")

        if [ -z "$PACKAGE" ]; then
            send_output "Could not extract package name from error."
            send_done "$EXIT_CODE"
            return
        fi

        send_output "Installing '$PACKAGE'..."
        PIP_WORK_DIR="/packages/.pip-work"
        mkdir -p "$PIP_WORK_DIR"
        cd "$PIP_WORK_DIR"

        INSTALL_OUTPUT=$("$PYTHON_EXEC" -m pip install --no-cache-dir "$PACKAGE" 2>&1)
        INSTALL_EXIT_CODE=$?
        
        send_output "$INSTALL_OUTPUT"
        rm -rf "$PIP_WORK_DIR"

        if [ $INSTALL_EXIT_CODE -ne 0 ]; then
            send_output "Failed to install package '$PACKAGE'."
            send_done "$INSTALL_EXIT_CODE"
            return
        fi

        # Re-run the code after successful installation
        send_output "Re-running the code..."
        OUTPUT=$("$PYTHON_EXEC" -c "$CODE" 2>&1)
        EXIT_CODE=$?
    fi

    send_output "$OUTPUT"
    send_done "$EXIT_CODE"
}

main

