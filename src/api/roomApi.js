import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

export const createRoom = async (payload) => {
  const res = await api.post("/rooms", payload);
  return res.data;
};

export const joinRoom = async (roomCode, payload) => {
  const res = await api.post(`/rooms/${roomCode}/join`, payload);
  return res.data;
};

export const getRoom = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}`);
  return response.data;
};

export const getPublicRooms = async () => {
  const response = await api.get("/rooms/public");
  return response.data;
};

export const joinRandomRoom = async (playerRequest) => {
  const response = await api.post("/rooms/join-random", playerRequest);
  return response.data;
};

export const setReadyState = async (roomCode, playerId, isReady) => {
  // Sending both 'ready' and 'isReady' safely bypasses whichever property name the backend uses
  const response = await api.post(`/rooms/${roomCode}/ready`, {
    playerId,
    ready: isReady,
    isReady: isReady
  });
  return response.data;
};
