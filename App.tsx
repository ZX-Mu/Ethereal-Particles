
import React, { useState, useEffect, useRef } from 'react';
import ParticleSystem from './components/ParticleSystem';
import { ParticleShape, HandState } from './types';
import { generateAITheme } from './services/geminiService';

const App: React.FC = () => {
  const [shape, setShape] = useState<ParticleShape>('planet');
  const [color, setColor] = useState('#4facfe');
  const [handState, setHandState] = useState<HandState>({
    isOpen: false,
    distance: 0.3, // Default pleasant scale
    position: { x: 0, y: 0, z: 0 }
  });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastDistance = useRef(0.3);

  useEffect(() => {
    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setIsHandDetected(true);
        const landmarks = results.multiHandLandmarks[0];
        const center = landmarks[9];
        
        // Use distance between thumb tip (4) and index tip (8)
        const p1 = landmarks[4];
        const p2 = landmarks[8];
        const rawDist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        
        // Normalization: 0.04 (pinched) to 0.26 (fully open) mapped to 0-1
        const targetDistance = Math.min(Math.max((rawDist - 0.04) / 0.22, 0), 1);
        
        // Low-pass filter for jitter reduction
        const smoothedDistance = lastDistance.current * 0.75 + targetDistance * 0.25;
        lastDistance.current = smoothedDistance;
        
        setHandState({
          isOpen: smoothedDistance > 0.4,
          distance: smoothedDistance,
          position: {
            x: (center.x - 0.5) * 3,
            y: -(center.y - 0.5) * 3,
            z: 0
          }
        });
      } else {
        setIsHandDetected(false);
        // Smoothly return to default 0.3 scale when no hand is present
        lastDistance.current = lastDistance.current * 0.95 + 0.3 * 0.05;
        setHandState(prev => ({
          ...prev,
          distance: lastDistance.current,
          isOpen: false,
          position: { x: prev.position.x * 0.95, y: prev.position.y * 0.95, z: 0 }
        }));
      }
    });

    if (videoRef.current) {
      // @ts-ignore
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleAiTheme = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const result = await generateAITheme(aiPrompt);
    if (result) {
      setColor(result.color);
      setShape(result.shape);
    }
    setIsAiLoading(false);
    setAiPrompt('');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans text-white">
      <ParticleSystem shape={shape} color={color} handState={handState} />
      
      {/* Video Preview with Glow */}
      <video ref={videoRef} id="video-preview" className={`transition-all duration-300 ${isHandDetected ? 'opacity-100 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'opacity-20 grayscale border-gray-600'}`} autoPlay playsInline muted />

      {/* Hand Gesture Intensity HUD (Right Side - Refined & Subtle) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400/60 [writing-mode:vertical-lr] rotate-180">
          Sync Intensity
        </div>
        <div className="h-32 w-[3px] bg-white/10 rounded-full relative overflow-hidden backdrop-blur-md border border-white/5">
          <div 
            className="absolute bottom-0 w-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-100" 
            style={{ height: `${handState.distance * 100}%` }} 
          />
        </div>
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isHandDetected ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-gray-700'}`} />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-white via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            VOID PARTICLES
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${isHandDetected ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-gray-600'}`} />
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">
              {isHandDetected ? 'Hand Linked' : 'Gesture Sensor Ready'}
            </p>
          </div>
        </div>

        <button onClick={handleFullscreen} className="pointer-events-auto p-4 glass rounded-2xl hover:bg-white/10 transition-all active:scale-95 group border border-white/5 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Control Sidebar */}
      <div className="absolute left-8 bottom-8 w-80 glass p-8 rounded-[2rem] flex flex-col gap-8 z-40 border border-white/5 shadow-2xl">
        <div>
          <label className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80 font-black mb-4 block">Core Geometry</label>
          <div className="grid grid-cols-3 gap-3">
            {(['heart', 'flower', 'star', 'firework', 'planet', 'random'] as ParticleShape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`py-3 text-[10px] uppercase font-black rounded-xl transition-all border ${shape === s ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105' : 'bg-white/5 border-transparent hover:border-white/20 text-gray-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80 font-black mb-4 block">Aura Hue</label>
          <div className="flex items-center gap-4">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" />
            <span className="text-sm font-mono text-cyan-100/60 uppercase font-bold tracking-widest">{color}</span>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <label className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80 font-black mb-3 block">AI Theme Engine</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="GENERATE NEBULA..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiTheme()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700 font-bold uppercase"
            />
            <button 
              onClick={handleAiTheme} 
              disabled={isAiLoading || !aiPrompt} 
              className="bg-white text-black font-black text-[10px] px-5 rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-20 shadow-lg active:scale-95"
            >
              {isAiLoading ? '...' : 'AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
