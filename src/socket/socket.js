import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

// Connect directly to the backend for WebSocket — Vercel's HTTP proxy cannot upgrade
// to a native WebSocket connection, causing slow HTTP long-polling for every draw point.
const BACKEND_WS_URL = "http://skribbl-env.eba-cuuiauxr.eu-north-1.elasticbeanstalk.com/ws";

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

  // Connect directly to backend — bypasses Vercel proxy so native WebSocket upgrade works.
  // Falls back to xhr-streaming only if native WS is unavailable.
  const socket = new SockJS(BACKEND_WS_URL, null, {
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
