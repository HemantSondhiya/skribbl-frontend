import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { connectSocket, disconnectSocket, getClient } from "../socket/socket";
import { getRoom } from "../api/roomApi";
import CanvasBoard from "../components/CanvasBoard";
import ChatBox from "../components/ChatBox";
import WordPicker from "../components/WordPicker";
import ScoreBoard from "../components/ScoreBoard";

export default function GamePage() {
  const { roomCode } = useParams();
  const [room, setRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Try to load bridged words from LobbyPage if we transitioned too slowly
  const [wordOptions, setWordOptions] = useState(() => {
    const bridged = sessionStorage.getItem("round1Words");
    if (bridged) {
      sessionStorage.removeItem("round1Words");
      return JSON.parse(bridged);
    }
    return [];
  });
  
  const [serverTime, setServerTime] = useState(null);

  const playerId = localStorage.getItem("playerId");

  useEffect(() => {
    loadRoom();

    connectSocket((client) => {
      client.subscribe(`/topic/rooms/${roomCode}/state`, (message) => {
        setRoom(JSON.parse(message.body));
      });

      client.subscribe(`/topic/rooms/${roomCode}/chat`, (message) => {
        setChatMessages((prev) => [...prev, JSON.parse(message.body)]);
      });

      // Listen for personal Private Direct Messages directly routed by ID (bypasses Spring Security Principal requirements)
      client.subscribe(`/topic/users/${playerId}/private`, (message) => {
        setChatMessages((prev) => [...prev, JSON.parse(message.body)]);
      });

      // Listen for a dedicated server timer ping every 1 second
      client.subscribe(`/topic/rooms/${roomCode}/timer`, (message) => {
        setServerTime(parseInt(message.body));
      });

      client.subscribe(`/topic/rooms/${roomCode}/word-options/${playerId}`, (message) => {
        setWordOptions(JSON.parse(message.body));
      });
    });

    return () => disconnectSocket();
  }, [roomCode, playerId]);

  const loadRoom = async () => {
    try {
      const data = await getRoom(roomCode);
      setRoom(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!room) return <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-cyan-400 font-mono">Connecting to Game Server...</p>
  </div>;

  const isDrawer = room.gameState.currentDrawerId === playerId;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6 min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-purple-500/30">
      {(room.gameState.phase === "GAME_OVER" || room.gameState.phase === "FINISHED") ? (
        <div className="md:col-span-12 lg:col-span-12 flex items-center justify-center p-8 overflow-hidden relative">
          {/* Confetti Background FX */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.15)] w-full max-w-3xl p-10 text-center animate-fade-in-up z-10 relative">
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-7xl drop-shadow-xl animate-bounce">🏆</div>
            
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 mb-4 drop-shadow-lg mt-8">Game Over!</h1>
            <h2 className="text-2xl text-neutral-400 mb-10 font-bold uppercase tracking-widest border-b border-white/5 pb-6">Final Standings</h2>
            
            <div className="space-y-4">
              {[...room.players].sort((a, b) => b.score - a.score).map((player, index) => (
                <div key={player.id} className={`p-4 px-6 rounded-2xl flex justify-between items-center text-xl font-bold transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 transform scale-[1.03] shadow-[0_0_30px_rgba(251,191,36,0.2)] text-amber-300' : index === 1 ? 'bg-zinc-800/50 border border-zinc-600/30 text-zinc-300' : index === 2 ? 'bg-orange-900/30 border border-orange-800/30 text-orange-400' : 'bg-neutral-900/50 border border-white/5 text-neutral-500'}`}>
                  <div className="flex items-center gap-5">
                    <span className={`text-4xl ${index === 0 ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : ''}`}>{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-2xl ml-2 mr-1">{index + 1}.</span>}</span>
                    <span className="text-2xl">{player.name}</span>
                  </div>
                  <span className="font-mono text-2xl tracking-wider">{player.score} pts</span>
                </div>
              ))}
            </div>

            <button onClick={() => window.location.href="/"} className="mt-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-xl py-4 px-10 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all hover:-translate-y-1">
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Background Ambient Glow */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

          <div className="md:col-span-3 lg:col-span-2 relative z-10 flex flex-col gap-4">
            <ScoreBoard players={room.players} drawerId={room.gameState.currentDrawerId} />
          </div>

          <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-4 relative z-10 h-[calc(100vh-2rem)]">
            {room.gameState.phase === "WORD_PICK" && isDrawer && (
              <WordPicker roomCode={roomCode} playerId={playerId} words={wordOptions} />
            )}

            <CanvasBoard room={room} playerId={playerId} serverTime={serverTime} />
          </div>

          <div className="md:col-span-3 lg:col-span-3 relative z-10">
            <ChatBox roomCode={roomCode} playerId={playerId} messages={chatMessages} players={room.players} />
          </div>
        </>
      )}
    </div>
  );
}
