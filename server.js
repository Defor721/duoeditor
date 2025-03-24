const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map(); // { docId: Set<socket> }

wss.on("connection", (ws) => {
  let currentRoom = null;

  ws.on("message", (message) => {
    const parsed = JSON.parse(message);

    if (parsed.type === "join") {
      currentRoom = parsed.docId;
      if (!rooms.has(currentRoom)) {
        rooms.set(currentRoom, new Set());
      }
      rooms.get(currentRoom).add(ws);
    }

    if (parsed.type === "update" && currentRoom) {
      const peers = rooms.get(currentRoom) || new Set();
      for (const client of peers) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ type: "update", content: parsed.content })
          );
        }
      }
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
    }
  });
});

server.listen(3001, () => {
  console.log("✅ WebSocket server running on ws://localhost:3001");
});
