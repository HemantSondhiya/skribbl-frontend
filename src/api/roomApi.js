import axios from "axios";

// Use VITE_API_BASE_URL from env (set to empty string in Vercel)
const envBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: `${envBaseUrl}/api/rooms`,
});

export const createRoom = async (payload) => {
  const res = await api.post("/", payload);
  return res.data;
};

export const joinRoom = async (roomCode, payload) => {
  const res = await api.post(`/${roomCode}/join`, payload);
  return res.data;
};

export const getRoom = async (roomCode) => {
  const response = await api.get(`/${roomCode}`);
  return response.data;
};

export const getPublicRooms = async () => {
  const response = await api.get("/public");
  return response.data;
};

export const joinRandomRoom = async (playerRequest) => {
  const response = await api.post("/join-random", playerRequest);
  return response.data;
};

export const setReadyState = async (roomCode, playerId, isReady) => {
  // Sending both 'ready' and 'isReady' safely bypasses whichever property name the backend uses
  const response = await api.post(`/${roomCode}/ready`, {
    playerId,
    ready: isReady,
    isReady: isReady
  });
  return response.data;
};
