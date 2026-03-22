import { useEffect, useRef, useState } from "react";
import { getClient } from "../socket/socket";

export default function CanvasBoard({ room, playerId, serverTime }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentSize, setCurrentSize] = useState(3);
  const [localTime, setLocalTime] = useState(0);

  const isDrawer = room.gameState.currentDrawerId === playerId;
  const strokeIdRef = useRef(null);
  const lastPointRef = useRef(null);

  useEffect(() => {
    if (serverTime !== null) {
      setLocalTime(serverTime);
    } else {
      setLocalTime(room.gameState.remainingSeconds || 0);
    }
  }, [serverTime, room.gameState.remainingSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Attach touch events natively with { passive: false } so preventDefault() works
  // React's synthetic touch events are passive by default, causing a console warning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
    canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
    canvas.addEventListener("touchend", handlePointerUp);
    canvas.addEventListener("touchcancel", handlePointerUp);
    return () => {
      canvas.removeEventListener("touchstart", handlePointerDown);
      canvas.removeEventListener("touchmove", handlePointerMove);
      canvas.removeEventListener("touchend", handlePointerUp);
      canvas.removeEventListener("touchcancel", handlePointerUp);
    };
  }, [isDrawer, drawing, currentColor, currentSize]);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    if (!drawing) {
      drawSavedStrokes();
    }
  }, [room.strokes, drawing]);

  const drawSavedStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill canvas background to white manually just in case
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (!room.strokes || room.strokes.length === 0) return;

    room.strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x, stroke.points[0].y);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      
      ctx.stroke();
    });
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (!isDrawer) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    setDrawing(true);
    strokeIdRef.current = crypto.randomUUID();

    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };
    sendPoint(x, y);
    
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(x, y);
    ctx.lineTo(x, y); 
    ctx.stroke();
  };

  const handlePointerMove = (e) => {
    if (!isDrawer || !drawing) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);

    if (lastPointRef.current && 
        Math.abs(lastPointRef.current.x - x) < 1 && 
        Math.abs(lastPointRef.current.y - y) < 1) {
      return;
    }

    sendPoint(x, y);

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (!isDrawer || !drawing) return; 
    setDrawing(false);
    lastPointRef.current = null;

    const client = getClient();
    if (client && client.connected) {
      client.publish({
        destination: "/app/draw.end",
        body: JSON.stringify({
          roomCode: room.roomCode,
          strokeId: strokeIdRef.current,
        }),
      });
    }
  };

  const handleClear = () => {
    if (!isDrawer) return;
    const client = getClient();
    if (client && client.connected) {
      // Send a dedicated clear command 
      client.publish({
        destination: "/app/draw.clear",
        body: JSON.stringify({
          roomCode: room.roomCode,
          playerId,
        }),
      });
      // Fallback: Also emit a massive white stroke in case the backend uses draw.add for clears
      client.publish({
        destination: "/app/draw.add",
        body: JSON.stringify({
          roomCode: room.roomCode,
          playerId,
          strokeId: crypto.randomUUID(),
          color: "#FFFFFF",
          size: 10000,
          x: 400,
          y: 300,
        }),
      });
      client.publish({
        destination: "/app/draw.end",
        body: JSON.stringify({ roomCode: room.roomCode, strokeId: crypto.randomUUID() }),
      });
    }
  };

  const sendPoint = (x, y) => {
    const client = getClient();
    if (client && client.connected) {
      client.publish({
        destination: "/app/draw.add",
        body: JSON.stringify({
          roomCode: room.roomCode,
          playerId,
          strokeId: strokeIdRef.current,
          color: currentColor,
          size: currentSize,
          x: Math.round(x),
          y: Math.round(y),
        }),
      });
    }
  };

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF",
    "#8B4513", "#FFA500", "#808080", "#FFC0CB" 
  ];
  
  const sizes = [3, 8, 15, 25];

  return (
    <div className="flex flex-col items-center w-full h-full" ref={containerRef}>
      <div className="bg-neutral-900 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col w-full h-full max-h-[calc(100vh-4rem)] border border-white/10 overflow-hidden relative backdrop-blur-md">
        
        {/* Top Header Bar */}
        <div className="bg-neutral-950 border-b border-white/5 px-6 py-4 flex justify-between items-center z-10 w-full">
          <div className="flex flex-col items-center bg-neutral-900 border border-white/5 py-1 px-4 rounded-xl shadow-inner min-w-[80px]">
            <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Round</span>
            <span className="text-xl font-mono font-bold text-white">
              {room.gameState.currentRound || 1} / {room.settings?.rounds || 3}
            </span>
          </div>

          <div className="flex flex-col items-center flex-1 mx-4 max-w-lg">
            <div className="bg-neutral-950 border border-white/10 py-3 px-8 rounded-2xl shadow-inner w-full flex justify-center items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <span className="text-3xl font-mono tracking-[0.25em] font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 drop-shadow-sm text-center">
                {isDrawer && (room.gameState.currentWord || room.gameState.word) 
                  ? (room.gameState.currentWord || room.gameState.word)
                  : (room.gameState.maskedWord || (room.gameState.phase === "LOBBY" ? "WAITING..." : "WAITING..."))}
              </span>
              
              {!isDrawer && room.gameState.wordLength > 0 && !room.gameState.maskedWord && (
                <span className="text-3xl font-mono tracking-[0.25em] font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 drop-shadow-sm text-center">
                  {Array(room.gameState.wordLength).fill("_").join(" ")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center bg-neutral-900 border border-white/5 py-1 px-4 rounded-xl shadow-inner min-w-[80px]">
            <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Time</span>
            <span className={`text-2xl font-bold font-mono ${localTime <= 10 && localTime > 0 ? 'text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-cyan-400'}`}>
              {localTime}
            </span>
          </div>
        </div>

        {/* Canvas Area wrapper matches aspect ratio tightly */}
        <div className="flex-1 w-full bg-neutral-800 flex items-center justify-center relative overflow-hidden p-2">
          {!isDrawer && room.gameState.phase === "DRAW" && (
            <div className="absolute top-6 left-6 z-10 bg-neutral-950/80 backdrop-blur-sm border border-white/10 text-cyan-400 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Artist is drawing
            </div>
          )}
          
          <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-neutral-900 rounded-xl overflow-hidden touch-none" style={{ maxWidth: "800px", width: "100%", aspectRatio: "4/3" }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className={`bg-white w-full h-full touch-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default pointer-events-none'}`}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
            />
          </div>
        </div>
        
        {/* Drawing Toolbar (Only show for drawer) */}
        <div className={`bg-neutral-950 px-6 py-4 flex flex-col md:flex-row items-center justify-center gap-6 border-t border-white/5 transition-all duration-300 ${isDrawer ? 'opacity-100 h-auto translate-y-0' : 'opacity-0 pointer-events-none h-0 p-0 overflow-hidden translate-y-10'}`}>
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 p-2 rounded-2xl shadow-inner">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setCurrentColor(c)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${currentColor === c ? 'scale-110 ring-4 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'ring-1 ring-white/20'}`}
                style={{ backgroundColor: c }}
                title={c === "#FFFFFF" ? "White" : c}
              />
            ))}
            
            {/* Eraser Tool (Selects White Color Explicitly + Icon) */}
            <button
              onClick={() => setCurrentColor("#FFFFFF")}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-110 ml-2 ${currentColor === "#FFFFFF" ? 'scale-110 bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-neutral-800 text-neutral-400 ring-1 ring-white/20 hover:text-white'}`}
              title="Eraser"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
            </button>

            {/* Clear Canvas Tool */}
            <button
              onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-110 ml-2 bg-neutral-800 text-neutral-400 ring-1 ring-white/20 hover:text-rose-500 hover:bg-rose-500/10 hover:ring-rose-500/50"
              title="Clear Canvas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-neutral-900 border border-white/5 p-2 px-4 rounded-2xl shadow-inner">
            {sizes.map(s => (
              <button
                key={s}
                onClick={() => setCurrentSize(s)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${currentSize === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                title={`Brush size ${s}`}
              >
                <div 
                  className="bg-current rounded-full" 
                  style={{ width: `${s}px`, height: `${s}px`, backgroundColor: currentSize === s ? '#22d3ee' : '#a3a3a3' }}
                ></div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
