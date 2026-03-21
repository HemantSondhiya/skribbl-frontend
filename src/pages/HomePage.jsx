import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createRoom, joinRoom, joinRandomRoom } from "../api/roomApi";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get("room") || "";

  const savedName = localStorage.getItem("playerName") || "";

  const [hostName, setHostName] = useState(savedName);
  const [joinName, setJoinName] = useState(savedName);
  const [roomCode, setRoomCode] = useState(initialRoom);

  // If a room is provided via URL and we already have a name, we can highlight the join section
  useEffect(() => {
    if (initialRoom && !savedName) {
      document.getElementById("joinNameInput")?.focus();
    }
  }, [initialRoom, savedName]);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) return;
    try {
      const data = await createRoom({
        hostName,
        settings: {
          maxPlayers: 8,
          rounds: 3,
          drawTimeSeconds: 80,
          wordChoices: 3,
          hintsEnabled: true,
          privateRoom: true
        }
      });

      localStorage.setItem("playerId", data.playerId);
      localStorage.setItem("playerName", hostName);
      navigate(`/lobby/${data.room.roomCode}`, { state: data });
    } catch (err) {
      console.error("Detailed create room error:", err);
      alert(err.response?.data?.message || "Failed to create room. Is your backend running? (Check console)");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinName.trim() || !roomCode.trim()) return;
    try {
      const data = await joinRoom(roomCode, { playerName: joinName });
      localStorage.setItem("playerId", data.playerId);
      localStorage.setItem("playerName", joinName);
      navigate(`/lobby/${roomCode}`, { state: data });
    } catch (err) {
      console.error("Detailed join room error:", err);
      alert(err.response?.data?.message || "Failed to join room. Check code & backend status.");
    }
  };

  const handleJoinRandom = async () => {
    if (!joinName.trim()) return;
    try {
      const data = await joinRandomRoom({ playerName: joinName });
      localStorage.setItem("playerId", data.playerId);
      localStorage.setItem("playerName", joinName);
      navigate(`/lobby/${data.room.roomCode}`, { state: data });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "No public rooms available right now! Try creating one.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Hero Header */}
      <div className="z-10 text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.5)] transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <span className="text-4xl font-black text-white">S</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 mb-3 drop-shadow-sm">
          SkribblClone
        </h1>
        <p className="text-lg text-neutral-400 font-medium max-w-lg mx-auto">Get together, draw poorly, and laugh hard. Create a private room or join an existing one.</p>
      </div>

      <div className="z-10 w-full max-w-4xl backdrop-blur-xl bg-neutral-900/60 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 relative">
          
          {/* Vertical Divider */}
          <div className="hidden md:block absolute top-[10%] left-1/2 -translate-x-1/2 w-px h-[80%] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* Create Room Side */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <h2 className="text-2xl font-bold">Create Room</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 mt-2">Display Name</label>
                <input
                  className="w-full bg-neutral-950/50 border border-white/10 p-4 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g. Picasso"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={15}
                />
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!hostName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg p-4 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:opacity-50 disabled:hover:shadow-none hover:-translate-y-1 transition-all"
              >
                Create Game
              </button>
            </div>
          </div>

          {/* Join Room Side */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold">Join Room</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 mt-2">Room Code</label>
                <input
                  className="w-full bg-neutral-950/50 border border-white/10 p-4 rounded-xl text-white placeholder-neutral-600 uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="e.g. 9TDQV7"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Display Name</label>
                <input
                  id="joinNameInput"
                  className="w-full bg-neutral-950/50 border border-white/10 p-4 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="e.g. DaVinci"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={15}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!joinName.trim() || !roomCode.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg p-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] disabled:opacity-50 disabled:hover:shadow-none hover:-translate-y-1 transition-all mt-2"
              >
                Join Private Game
              </button>
              <button
                onClick={handleJoinRandom}
                disabled={!joinName.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:hover:shadow-none hover:-translate-y-1 transition-all"
              >
                Quick Play (Random Room)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
