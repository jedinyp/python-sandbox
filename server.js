import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();

// Distinguish between browser clients and container clients
wss.on("connection", (ws) => {
  let socketId = null;
  let isBrowserClient = false;

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // A browser client registers itself with a unique ID
      if (data.register) {
        socketId = data.register;
        isBrowserClient = true;
        clients.set(socketId, ws);
        console.log(`Browser client registered: ${socketId}`);
        return;
      }

      // A container client sends messages that need to be forwarded
      if (data.socketId) {
        const browserClient = clients.get(data.socketId);
        if (browserClient && browserClient.readyState === WebSocket.OPEN) {
          browserClient.send(JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("Failed to process message:", e);
    }
  });

  ws.on("close", () => {
    
    // Only browser clients trigger a cleanup
    if (isBrowserClient && socketId) {
      clients.delete(socketId);
      console.log(`Browser client disconnected: ${socketId}. Triggering cleanup.`);
      
      fetch("http://localhost:3000/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: socketId }),
      })
      .then(res => res.json())
      .then(data => console.log(`Cleanup API response for ${socketId}:`, data))
      .catch(err => console.error(`Failed to trigger cleanup for ${socketId}:`, err));
    } else {
      console.log("A container client disconnected.");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
