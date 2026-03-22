import { useState, useRef, useEffect } from "react";
import { getClient } from "../socket/socket";

export default function ChatBox({ roomCode, playerId, messages, players = [] }) {
  const [text, setText] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    if (e && e.type === "submit") e.preventDefault();
    if (!text.trim()) return;

    const client = getClient();
    if (client && client.connected) {
      if (receiverId === "") {
        client.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({
            roomCode: roomCode,
            senderId: playerId,
            message: text,
          }),
        });
      } else {
        client.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({
            roomCode: roomCode,
            senderId: playerId,
            receiverId: receiverId, 
            message: text,
          }),
        });
      }
      setText("");
    }
  };

  return (
    <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-3 md:p-5 h-[400px] md:h-[calc(100vh-2rem)] flex flex-col border border-white/10">
      <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center px-2 z-10">
        <h2 className="text-lg font-black text-white tracking-widest flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          CHAT & GUESSES
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 pr-3 flex flex-col gap-2 relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <span className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No messages yet</span>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isServerMsg = (!msg.playerName && !msg.senderName) || msg.type === "SYSTEM" || msg.playerName === "SYSTEM" || msg.senderName === "SYSTEM";
          const isCorrectGuess = msg.isCorrectGuess || (isServerMsg && (msg.text?.includes("guessed the word") || msg.message?.includes("guessed the word")));
          const isPrivate = msg.type === "PRIVATE" || msg.receiverId;

          return (
            <div 
              key={index} 
              className={`p-2.5 md:p-3 rounded-2xl w-full flex flex-col shadow-sm backdrop-blur-sm ${
                isCorrectGuess ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 self-center max-w-[90%] text-center px-6 animate-pulse' : 
                isPrivate ? 'bg-purple-900/30 text-purple-200 border border-purple-500/40 font-medium self-end max-w-[90%] rounded-tr-sm' :
                isServerMsg ? 'bg-neutral-950/50 text-neutral-400 italic text-sm border border-white/5 self-center max-w-[90%] text-center' : 
                'bg-neutral-800/60 text-neutral-200 border border-white/5 self-start max-w-[95%] rounded-tl-sm hover:bg-neutral-800'
              }`}
            >
              {!isServerMsg && !isCorrectGuess && (
                <div className="flex items-center gap-2 mb-1">
                  <strong className={`text-xs uppercase tracking-widest ${isPrivate ? 'text-purple-400' : 'text-neutral-400'}`}>
                    {msg.playerName || msg.senderName}
                  </strong>
                  {isPrivate && <span className="text-[10px] text-purple-950 font-black uppercase bg-purple-400 px-1.5 py-0.5 rounded ml-auto">Secret</span>}
                </div>
              )}
              <span className={`break-words leading-relaxed ${isCorrectGuess ? 'text-lg' : ''}`}>{msg.text || msg.message}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex flex-col gap-3 pt-4 border-t border-white/10 z-10 shrink-0">
        <div className="relative">
          <select 
            className="w-full appearance-none bg-neutral-950 border border-white/10 p-3 rounded-xl text-sm text-neutral-300 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-purple-500 transition-colors"
            value={receiverId} 
            onChange={e => setReceiverId(e.target.value)}
          >
            <option value="">🌎 Everyone in Room (Public)</option>
            {players.filter(p => p.id !== playerId).map(p => (
              <option key={p.id} value={p.id}>🤫 Whisper privately to {p.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className={`flex-1 bg-neutral-950 border p-3 md:p-4 text-sm rounded-xl focus:ring-2 focus:outline-none transition-all ${receiverId ? 'border-purple-500/50 focus:ring-purple-500 text-purple-100 placeholder-purple-900/50' : 'border-white/10 focus:ring-cyan-500 text-white placeholder-neutral-600'}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={receiverId ? "Type a secret whisper..." : "Type guess or message..."}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={!text.trim()}
            className={`font-black uppercase tracking-wider px-6 rounded-xl transition-all disabled:opacity-30 disabled:hover:scale-100 ${receiverId ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(8,145,178,0.3)]'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
