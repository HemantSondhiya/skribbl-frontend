import axios from "axios";

const BASE_URL = "/api/rooms";

export const createRoom = async (payload) => {
  const res = await axios.post(BASE_URL, payload);
  return res.data;
};

export const joinRoom = async (roomCode, payload) => {
  const res = await axios.post(`${BASE_URL}/${roomCode}/join`, payload);
  return res.data;
};

export const getRoom = async (roomCode) => {
  const response = await axios.get(`${BASE_URL}/${roomCode}`);
  return response.data;
};

export const getPublicRooms = async () => {
  const response = await axios.get(`${BASE_URL}/public`);
  return response.data;
};

export const joinRandomRoom = async (playerRequest) => {
  const response = await axios.post(`${BASE_URL}/join-random`, playerRequest);
  return response.data;
};

export const setReadyState = async (roomCode, playerId, isReady) => {
  // Sending both 'ready' and 'isReady' safely bypasses whichever property name the backend uses
  const response = await axios.post(`${BASE_URL}/${roomCode}/ready`, {
    playerId,
    ready: isReady,
    isReady: isReady
  });
  return response.data;
};
