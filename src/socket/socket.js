import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectSocket = (onConnected) => {
  // If we already have a successfully connected client, just return it immediately
  if (stompClient && stompClient.connected) {
    onConnected(stompClient);
    return;
  }

  // If a client exists but isn't connected, reset it for a clean slate.
  if (stompClient) {
    stompClient.deactivate();
  }

  // Use Vercel's proxy (/ws) so SSL is handled correctly.
  // Allow native WebSocket transport first — Vercel Edge Network supports WS upgrades
  // through rewrites, so this should be fast. Falls back to xhr-streaming if needed.
  const socket = new SockJS("/ws", null, {
    transports: ["websocket", "xhr-streaming", "xhr-polling"]
  });

  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("🟢 Connected to WebSocket securely!");
      onConnected(stompClient);
    },
    onStompError: (frame) => {
      console.error("🔴 STOMP protocol error:", frame);
    },
    onWebSocketError: (event) => {
      console.error("🔴 Browser WebSocket Error (Check your backend CORS!):", event);
    },
    onDisconnect: () => {
      console.log("📴 Disconnected from WebSocket.");
    }
  });

  stompClient.activate();
};

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

export const getClient = () => stompClient;
