
import React, { useState, useEffect, useRef } from 'react';
import ParticleSystem from './components/ParticleSystem';
import { ParticleShape, HandState } from './types';
import { generateAITheme } from './services/geminiService';

const App: React.FC = () => {
  const [shape, setShape] = useState<ParticleShape>('planet');
  // Store colors individually for each shape to prevent cross-contamination
  const [shapeColors, setShapeColors] = useState<Record<ParticleShape, string>>({
    heart: '#ff2a6d',
    star: '#fff9c4',
    tree: '#0f5e34', // Forest Green
    planet: '#00eaff'
  });

  const [handState, setHandState] = useState<HandState>({
    isOpen: false,
    distance: 0.25, 
    position: { x: 0, y: 0, z: 0 }
  });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastDistance = useRef(0.25);

  useEffect(() => {
    console.log('👋 Initializing hand tracking...');

    // Check if MediaPipe is loaded
    // @ts-ignore
    if (!window.Hands) {
      console.error('❌ MediaPipe Hands not loaded! Check if scripts are loaded correctly.');
      return;
    }

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    console.log('✅ MediaPipe Hands initialized');

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    let resultsCount = 0;
    hands.onResults((results: any) => {
      resultsCount++;
      if (resultsCount === 1) {
        console.log('✅ Hand tracking results received');
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        if (!isHandDetected) {
          console.log('👋 Hand detected!');
        }
        setIsHandDetected(true);
        const landmarks = results.multiHandLandmarks[0];
        const center = landmarks[9];

        const p1 = landmarks[4];
        const p2 = landmarks[8];
        const rawDist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        const targetDistance = Math.min(Math.max((rawDist - 0.04) / 0.21, 0), 1);
        const smoothedDistance = lastDistance.current * 0.7 + targetDistance * 0.3;
        lastDistance.current = smoothedDistance;

        setHandState({
          isOpen: smoothedDistance > 0.45,
          distance: smoothedDistance,
          position: {
            x: (center.x - 0.5) * 4,
            y: -(center.y - 0.5) * 4,
            z: 0
          }
        });
      } else {
        setIsHandDetected(false);
        lastDistance.current = lastDistance.current * 0.95 + 0.25 * 0.05;
        setHandState(prev => ({
          ...prev,
          distance: lastDistance.current,
          isOpen: false,
          position: { x: prev.position.x * 0.95, y: prev.position.y * 0.95, z: 0 }
        }));
      }
    });

    if (videoRef.current) {
      console.log('📹 Starting camera...');
      // @ts-ignore
      if (!window.Camera) {
        console.error('❌ MediaPipe Camera not loaded!');
        return;
      }

      // @ts-ignore
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480
      });
      camera.start().then(() => {
        console.log('✅ Camera started successfully');
      }).catch((err: any) => {
        console.error('❌ Camera failed to start:', err);
      });
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

  const handleColorChange = (newColor: string) => {
    setShapeColors(prev => ({
      ...prev,
      [shape]: newColor
    }));
  };

  const handleAiTheme = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const result = await generateAITheme(aiPrompt);
    if (result) {
      setShape(result.shape as ParticleShape);
      setShapeColors(prev => ({
        ...prev,
        [result.shape]: result.color
      }));
    }
    setIsAiLoading(false);
    setAiPrompt('');
  };

  // Current color for the active shape
  const currentColor = shapeColors[shape];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans text-white">
      <ParticleSystem shape={shape} color={currentColor} handState={handState} />
      
      <video ref={videoRef} id="video-preview" className={`transition-all duration-500 border-2 ${isHandDetected ? 'opacity-100 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'opacity-10 grayscale border-white/10'}`} autoPlay playsInline muted />

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-6 opacity-60 hover:opacity-100 transition-all duration-300">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400/50 [writing-mode:vertical-lr] rotate-180 mb-2">
          Gesture Force
        </div>
        <div className="h-48 w-1 bg-white/5 rounded-full relative overflow-hidden backdrop-blur-xl border border-white/5 shadow-inner">
          <div 
            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 via-cyan-400 to-white shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all duration-150" 
            style={{ height: `${handState.distance * 100}%` }} 
          />
        </div>
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isHandDetected ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-white/10'}`} />
      </div>

      <div className="absolute top-0 left-0 w-full p-10 flex justify-between items-start z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-5xl font-black tracking-tighter italic bg-gradient-to-r from-white via-cyan-300 to-blue-500 bg-clip-text text-transparent uppercase">
            ETHEREAL PARTICLES
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className={`w-1.5 h-1.5 rounded-full ${isHandDetected ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-[0.4em]">
              {isHandDetected ? 'Biometric Link Active' : 'Waiting for Gesture'}
            </p>
          </div>
        </div>

        <button onClick={handleFullscreen} className="pointer-events-auto p-5 glass rounded-3xl hover:bg-white/10 transition-all active:scale-90 border border-white/10 shadow-2xl group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <div className="absolute left-10 bottom-10 w-80 glass p-10 rounded-[2.5rem] flex flex-col gap-10 z-40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div>
          <label className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black mb-5 block">Geometry Core</label>
          <div className="grid grid-cols-2 gap-4">
            {(['heart', 'star', 'tree', 'planet'] as ParticleShape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`py-3.5 text-[10px] uppercase font-black rounded-2xl transition-all border ${shape === s ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 border-white/5 hover:border-white/20 text-white/30 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black mb-5 block">Chromatic Aura</label>
          <div className="flex items-center gap-5">
            <div className="relative group">
              <input 
                type="color" 
                value={currentColor} 
                onChange={(e) => handleColorChange(e.target.value)} 
                className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-2xl overflow-hidden scale-110" 
              />
            </div>
            <span className="text-xs font-mono text-white/50 uppercase font-bold tracking-[0.2em]">{currentColor}</span>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <label className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black mb-4 block">AI Theme Synthesizer</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Neon Dreams..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiTheme()}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] text-white focus:outline-none focus:border-cyan-400 transition-all placeholder:text-white/10 font-bold uppercase tracking-widest"
            />
            <button 
              onClick={handleAiTheme} 
              disabled={isAiLoading || !aiPrompt} 
              className="bg-cyan-400 text-black font-black text-[10px] px-6 rounded-2xl hover:bg-white transition-all disabled:opacity-20 active:scale-90 shadow-xl"
            >
              {isAiLoading ? '...' : 'GEN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
