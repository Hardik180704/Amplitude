import React from 'react';
import { useProjectStore } from '../store';
import { MixerPanel } from './MixerPanel';
import { Deck } from './Deck';
import { audioEngine } from '../audio/AudioEngine';

const BackgroundVisualizer = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrame: number;
        const meters = new Float32Array(32);
        
        const render = () => {
             audioEngine.readTrackMeters(meters);
             
             const width = canvas.width;
             const height = canvas.height;
             ctx.clearRect(0, 0, width, height);
             
             const barWidth = width / 16; 
             
             const gradient = ctx.createLinearGradient(0, height, 0, 0);
             gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue
             gradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)'); // Pink transparent
             
             ctx.fillStyle = gradient;
             
             for (let i = 0; i < 16; i++) {
                 // Visualize first 16 tracks or wrap
                 const level = meters[i] || 0; 
                 
                 const barHeight = level * height * 0.8;
                 const x = i * barWidth;
                 const y = height - barHeight;
                 
                 ctx.fillRect(x, y, barWidth - 4, barHeight);
                 
                 // Reflection/Glow
                 ctx.shadowBlur = 20;
                 ctx.shadowColor = '#3b82f6';
             }
             
             animationFrame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none opacity-30">
             <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-cover opacity-50 blur-[2px]" />
        </div>
    );
};

// Wrapper for Large Deck
const LargeDeck = ({ trackId, label, color }: { trackId: number, label: string, color: string }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 border border-white/5 rounded-3xl bg-[#0d121f] relative overflow-hidden shadow-2xl">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, ${color}, transparent)` }}></div>
            
            {/* Top Label */}
            <div className="absolute top-6 left-6 text-4xl font-black text-white/10 tracking-tighter select-none pointer-events-none">
                {label}
            </div>

            {/* Deck */}
            <div className="relative z-10 scale-125">
                 <Deck trackId={trackId} size={300} />
            </div>

            {/* Waveform Placeholder (Canvas later) */}
            <div className="w-full h-32 mt-12 bg-black/40 rounded-lg border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/20 font-mono">
                    SCROLLING WAVEFORM
                </div>
                {/* Simulated Wave */}
                <div className="absolute top-1/2 left-0 right-0 h-[10px] bg-current opacity-30 w-full" style={{ color }}></div>
            </div>
        </div>
    );
};

export const DJPerformanceView = () => {
    const { project } = useProjectStore();
    
    // Auto-assign first two tracks to A and B
    // In real app, user maps them.
    const trackA = project.tracks.find(t => t.crossfaderGroup === 'A') || project.tracks[0];
    const trackB = project.tracks.find(t => t.crossfaderGroup === 'B') || project.tracks[1];

    const { setTrackFxStutter, setTrackFxTapeStop, setTrackLoop } = useProjectStore();

    return (
        <div className="w-full h-full bg-[#05070a] flex flex-col p-4 gap-4 relative overflow-hidden">
            
            <BackgroundVisualizer />

            {/* Main Console Area */}
            <div className="flex-1 flex gap-4 min-h-0 z-10">
                {/* Left Deck (A) */}
                {trackA ? (
                    <LargeDeck trackId={trackA.id} label="DECK A" color="#0ea5e9" /> // Sky Blue
                ) : (
                    <div className="flex-1 flex items-center justify-center border border-white/5 rounded-3xl text-white/20 bg-black/40 backdrop-blur-sm">Empty Deck A</div>
                )}

                {/* Central Mixer */}
                <div className="w-[400px] shrink-0 flex flex-col border border-white/5 rounded-2xl bg-[#0a0e17]/90 backdrop-blur-md shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="h-12 border-b border-white/5 flex items-center justify-center bg-[#111625]">
                        <span className="text-xs font-black tracking-[0.3em] text-accent-primary">MIXER</span>
                    </div>
                    
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 overflow-hidden">
                            <MixerPanel />
                        </div>
                    </div>
                </div>

                {/* Right Deck (B) */}
                {trackB ? (
                     <LargeDeck trackId={trackB.id} label="DECK B" color="#f43f5e" /> // Rose Red
                ) : (
                    <div className="flex-1 flex items-center justify-center border border-white/5 rounded-3xl text-white/20 bg-black/40 backdrop-blur-sm">Empty Deck B</div>
                )}
            </div>
            
            {/* Performance Pads / Footer */}
            <div className="h-40 border border-white/5 rounded-2xl bg-[#0a0e17]/80 backdrop-blur-md flex items-center justify-center gap-8 shadow-lg z-10 px-8">
                {/* Left FX Grid */}
                <div className="flex-1 flex gap-2 justify-center">
                    <FXPad label="STUTTER" color="cyan" disabled={!trackA} onDown={() => trackA && setTrackFxStutter(trackA.id, true)} onUp={() => trackA && setTrackFxStutter(trackA.id, false)} />
                    <FXPad label="BRAKE" color="red" disabled={!trackA} onDown={() => trackA && setTrackFxTapeStop(trackA.id, true)} onUp={() => trackA && setTrackFxTapeStop(trackA.id, false)} />
                    <FXPad label="LOOP 4" color="yellow" disabled={!trackA} onDown={() => trackA && setTrackLoop(trackA.id, true, 4)} onUp={() => trackA && setTrackLoop(trackA.id, false)} />
                    <FXPad label="HORN" color="white" disabled={false} onDown={() => { /* Sampler not impl */ }} onUp={() => {}} />
                </div>
                
                <div className="text-white/10 font-black text-2xl tracking-[0.2em] -rotate-90 origin-center text-[10px] w-4 whitespace-nowrap">
                   PERFORMANCE
                </div>

                {/* Right FX Grid */}
                <div className="flex-1 flex gap-2 justify-center">
                    <FXPad label="STUTTER" color="pink" disabled={!trackB} onDown={() => trackB && setTrackFxStutter(trackB.id, true)} onUp={() => trackB && setTrackFxStutter(trackB.id, false)} />
                    <FXPad label="BRAKE" color="red" disabled={!trackB} onDown={() => trackB && setTrackFxTapeStop(trackB.id, true)} onUp={() => trackB && setTrackFxTapeStop(trackB.id, false)} />
                    <FXPad label="LOOP 4" color="orange" disabled={!trackB} onDown={() => trackB && setTrackLoop(trackB.id, true, 4)} onUp={() => trackB && setTrackLoop(trackB.id, false)} />
                    <FXPad label="SIREN" color="white" disabled={false} onDown={() => { /* Sampler not impl */ }} onUp={() => {}} />
                </div>
            </div>
        </div>
    );
};

const FXPad = ({ label, color, onDown, onUp, disabled }: any) => {
    return (
        <button 
            disabled={disabled}
            className={`w-24 h-24 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:shadow-inner active:brightness-110 ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : 'active:scale-95'}`}
            style={{ backgroundColor: disabled ? 'transparent' : `rgba(255,255,255,0.05)`, borderColor: disabled ? '#333' : color }}
            onMouseDown={disabled ? undefined : onDown}
            onMouseUp={disabled ? undefined : onUp}
            onMouseLeave={disabled ? undefined : onUp} // Safety release
        >
            <div className={`w-full h-1 bg-${color}-500 blur-md opacity-20`}></div>
            <span className="font-black tracking-widest text-[10px] text-white/50">{label}</span>
            <div className={`w-full h-1 bg-${color}-500 blur-md opacity-20`}></div>
        </button>
    )
}
