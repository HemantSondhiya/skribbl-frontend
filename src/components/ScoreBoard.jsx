export default function ScoreBoard({ players, drawerId }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-5 border border-white/10 h-full max-h-48 md:max-h-none overflow-y-auto">
      <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3 md:mb-5 border-b border-white/10 pb-2 md:pb-3">Leaderboard</h2>
      <div className="space-y-2 md:space-y-3">
        {sortedPlayers.map((player, index) => {
          const isDrawing = player.id === drawerId;
          
          return (
            <div key={player.id} className={`rounded-xl p-3 flex justify-between items-center transition-all ${index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-neutral-950/50 border border-white/5'}`}>
              <div className="flex items-center gap-3">
                <span className={`font-bold w-5 flex justify-center ${index === 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                  {index === 0 ? '👑' : `${index + 1}.`}
                </span>
                <div className="flex flex-col">
                  <span className={`font-bold ${index === 0 ? 'text-amber-100' : 'text-neutral-200'} ${isDrawing ? 'text-cyan-400' : ''}`}>
                    {player.name} {isDrawing && '🎨'}
                  </span>
                  <span className={`text-xs font-mono font-bold mt-0.5 ${index === 0 ? 'text-amber-500' : 'text-neutral-500'}`}>
                    {player.score} pts
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
