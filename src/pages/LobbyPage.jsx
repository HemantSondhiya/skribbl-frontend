import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoom, setReadyState } from "../api/roomApi";
import { connectSocket, disconnectSocket, getClient } from "../socket/socket";

export default function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);

  const playerId = localStorage.getItem("playerId");

  useEffect(() => {
    loadRoom();

    // Use refs to coordinate the two async events without a blind timeout:
    // 1. Game phase changes to non-LOBBY
    // 2. Word options arrive (only sent to the drawer)
    const stateRef = { gameStarted: false, isDrawer: false, words: [], navigated: false };

    const maybeNavigate = () => {
      if (stateRef.navigated) return;
      // Navigate once game has started AND (we have words OR we are not the drawer)
      if (stateRef.gameStarted && (stateRef.words.length > 0 || !stateRef.isDrawer)) {
        stateRef.navigated = true;
        navigate(`/game/${roomCode}`, { state: { words: stateRef.words } });
      }
    };

    connectSocket((client) => {
      // 1. Listen for room state updates
      client.subscribe(`/topic/rooms/${roomCode}/state`, (message) => {
        const updatedRoom = JSON.parse(message.body);
        setRoom(updatedRoom);

        if (updatedRoom.gameState.phase !== "LOBBY") {
          stateRef.isDrawer = updatedRoom.gameState.currentDrawerId === playerId;
          stateRef.gameStarted = true;
          maybeNavigate();
        }
      });

      // 2. Catch Round 1 words — arrive almost simultaneously with the state change
      client.subscribe(`/topic/rooms/${roomCode}/word-options/${playerId}`, (message) => {
        stateRef.words = JSON.parse(message.body);
        maybeNavigate();
      });
    });

    // We intentionally do NOT call disconnectSocket() so the socket survives the page transition
  }, [roomCode, navigate, playerId]);

  const loadRoom = async () => {
    try {
      const data = await getRoom(roomCode);
      setRoom(data);
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const startGame = () => {
    const client = getClient();
    if (client && client.connected) {
      client.publish({
        destination: "/app/game.start",
        body: JSON.stringify({
          roomCode,
          playerId,
        }),
      });
    } else {
      alert("Socket not connected yet");
    }
  };

  const toggleReady = async () => {
    try {
      const me = room.players.find((p) => p.id === playerId);
      await setReadyState(roomCode, playerId, !me?.ready);
    } catch (err) {
      console.error("Failed to set ready state", err);
    }
  };

  if (!room) return <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-cyan-400 font-mono">Loading Sector...</p>
  </div>;

  const me = room.players.find((p) => p.id === playerId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 relative overflow-hidden font-sans pt-16 p-6">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="backdrop-blur-xl bg-neutral-900/60 border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12 mb-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/10">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow">Game Lobby</h1>
              <p className="text-neutral-400 font-medium text-lg">Hold tight while artists join your room!</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Room Code</span>
              <div className="flex items-center gap-3 bg-neutral-950 border border-white/10 px-6 py-4 rounded-2xl shadow-inner">
                <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-widest">
                  {room.roomCode}
                </span>
                <div className="flex gap-2 ml-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(room.roomCode)}
                    className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" 
                    title="Copy Room Code">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?room=${room.roomCode}`)}
                    className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 transition-colors" 
                    title="Copy Invite Link">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              Players Connected
            </h2>
            <span className="bg-neutral-800 text-cyan-400 font-mono font-bold px-4 py-2 rounded-full border border-white/10">
              {room.players.length} / {room.settings?.maxPlayers || 8}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {room.players.map((player) => (
              <div key={player.id} className="bg-neutral-800/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-neutral-800/80 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-inner ${player.host ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-cyan-600'}`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-white truncate max-w-[120px]">{player.name}</span>
                  {player.host ? (
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider text-left">👑 Host</span>
                  ) : (
                    <span className={`text-xs font-bold uppercase tracking-wider text-left ${player.ready ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {player.ready ? '✔️ Ready' : 'Not Ready'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, (room.settings?.maxPlayers || 8) - room.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex items-center gap-4 bg-neutral-900/20">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <div className="h-4 w-16 bg-white/5 rounded-full"></div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-6 border-t border-white/10">
            {me?.host ? (
              <button
                onClick={startGame}
                disabled={room.players.length < 2 || room.players.some(p => !p.host && !p.ready)}
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-extrabold text-2xl text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                  {room.players.length < 2 
                    ? "Waiting for players..." 
                    : room.players.some(p => !p.host && !p.ready) 
                      ? "Waiting for all to be Ready..." 
                      : "Start Game Now!"}
                </span>
              </button>
            ) : (
              <button
                onClick={toggleReady}
                className={`group relative px-10 py-5 rounded-full font-extrabold text-2xl text-white shadow-xl transition-all ${me?.ready ? 'bg-neutral-700 hover:bg-neutral-600 border border-neutral-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-105'}`}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {me?.ready ? 'Cancel Ready' : 'I am Ready!'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
