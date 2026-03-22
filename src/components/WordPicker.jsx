import { getClient } from "../socket/socket";

export default function WordPicker({ roomCode, playerId, words }) {
  const chooseWord = (word) => {
    const client = getClient();
    if (client && client.connected) {
      localStorage.removeItem("wordOptions");
      client.publish({
        destination: "/app/game.choose-word",
        body: JSON.stringify({
          roomCode,
          playerId,
          word,
        }),
      });
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md rounded-3xl m-2 border border-white/5 shadow-2xl">
      <div className="bg-neutral-900 border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-[0_0_80px_rgba(168,85,247,0.15)] text-center max-w-2xl w-full mx-6 transform animate-fade-in-up relative overflow-hidden">
        
        {/* Decorative Gradients */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-neutral-800 border border-white/10 mb-6 drop-shadow-md">
            <span className="text-3xl">🎨</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400 drop-shadow-sm">
            {words.length > 0 ? "CHOOSE A WORD" : "WAITING FOR WORDS..."}
          </h2>

          {words.length > 0 ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4 lg:gap-6">
              {words.map((word, index) => (
                <button
                  key={index}
                  onClick={() => chooseWord(word)}
                  className="group relative flex-1 min-w-[140px] px-6 py-5 bg-neutral-950 border border-white/10 rounded-2xl hover:bg-neutral-800 hover:-translate-y-2 transition-all duration-300 shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 text-xl font-bold font-mono tracking-widest text-cyan-400 group-hover:text-cyan-300">
                    {word}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center my-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <p className="mt-10 font-medium text-neutral-500 uppercase tracking-widest text-sm">
            You are the Artist this round!
          </p>
        </div>
      </div>
    </div>
  );
}
