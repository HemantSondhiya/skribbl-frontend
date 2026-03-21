import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectSocket = (onConnected) => {
  // If we already have a successfully connected client, just return it immediately
  if (stompClient && stompClient.connected) {
    onConnected(stompClient);
    return;
  }

  // If a client exists but isn't connected, it might be in the middle of connecting.
  // We'll reset it to ensure a clean slate for StrictMode.
  if (stompClient) {
    stompClient.deactivate();
  }

  const socket = new SockJS("/ws");

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
