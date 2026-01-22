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

const LargeDeck = ({ trackId, label, color }: { trackId: number, label: string, color: string }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-between p-6 border border-white/5 rounded-3xl bg-[#080808] relative overflow-hidden shadow-2xl group">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b opacity-5 z-0" style={{ backgroundImage: `linear-gradient(to bottom, ${color}, transparent)` }}></div>
            
            {/* Header Info */}
            <div className="w-full flex justify-between items-start z-10 mb-8">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">{label}</span>
                    <span className="text-xl font-bold text-white tracking-tight">Track {trackId}</span>
                    <span className="text-xs text-white/40 font-mono">124.00 BPM</span>
                </div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-white/50">
                    KEY: Am
                </div>
            </div>

            {/* Deck */}
            <div className="relative z-10 scale-100 hover:scale-[1.02] transition-transform duration-500">
                 <Deck trackId={trackId} size={280} />
            </div>

            {/* Scrolling Waveform (Simulated) */}
            <div className="w-full h-24 mt-8 bg-[#111] rounded-lg border border-white/5 relative overflow-hidden group-hover:border-white/10 transition-colors">
                {/* Grid */}
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, transparent 98%, rgba(255,255,255,0.03) 98%)', backgroundSize: '20px 100%' }}></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     {/* Dynamic Wave Shape using multiple gradients */}
                     <div className="w-full h-full flex items-center justify-center gap-[1px]">
                         {Array.from({ length: 60 }).map((_, i) => (
                             <div 
                                key={i} 
                                className="w-1 bg-current rounded-full" 
                                style={{ 
                                    height: `${20 + Math.random() * 60}%`, 
                                    color: color, 
                                    opacity: Math.random() * 0.5 + 0.5 
                                }}
                            ></div>
                         ))}
                     </div>
                </div>
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/50 shadow-[0_0_10px_white]"></div>
            </div>
        </div>
    );
};

export const DJPerformanceView = () => {
    const { project, setTrackFxStutter, setTrackFxTapeStop, setTrackLoop } = useProjectStore();
    
    // Auto-assign first two tracks to A and B
    const trackA = project.tracks.find(t => t.crossfaderGroup === 'A') || project.tracks[0];
    const trackB = project.tracks.find(t => t.crossfaderGroup === 'B') || project.tracks[1];

    return (
        <div className="w-full h-full bg-[#030304] flex flex-col p-6 gap-6 relative overflow-hidden font-sans">
            
            <BackgroundVisualizer />

            {/* Main Console Area */}
            <div className="flex-1 flex gap-6 min-h-0 z-10 items-stretch">
                {/* Left Deck (A) */}
                {trackA ? (
                    <LargeDeck trackId={trackA.id} label="DECK A" color="#3b82f6" /> 
                ) : (
                    <div className="flex-1 border border-dashed border-white/10 rounded-3xl flex items-center justify-center text-white/20">Empty Deck A</div>
                )}

                {/* Central Mixer (Hardware Look) */}
                <div className="w-[380px] shrink-0 flex flex-col rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                    {/* Metal Texture */}
                    <div className="absolute inset-0 bg-[#151515] z-0">
                         {/* Brushed Vertical Lines */}
                         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 2px, #fff 3px, transparent 4px)' }}></div>
                         {/* Vignette */}
                         <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>
                    </div>
                    
                    {/* Header */}
                    <div className="h-14 border-b border-black/50 flex items-center justify-center relative z-10 bg-gradient-to-b from-[#222] to-[#111]">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black tracking-[0.3em] text-white/60">AMPLITUDE</span>
                            <span className="text-[8px] text-blue-500 tracking-wider">PRO MIXER</span>
                        </div>
                        {/* Screws */}
                        <div className="absolute left-3 top-3 w-1.5 h-1.5 rounded-full bg-[#333] shadow-inner border border-[#111]"></div>
                        <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-[#333] shadow-inner border border-[#111]"></div>
                    </div>
                    
                    <div className="flex-1 relative z-10 px-1 py-4">
                         <div className="h-full border-x border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm mx-2 rounded-lg overflow-hidden">
                             <MixerPanel />
                         </div>
                    </div>
                </div>

                {/* Right Deck (B) */}
                {trackB ? (
                     <LargeDeck trackId={trackB.id} label="DECK B" color="#ec4899" />
                ) : (
                    <div className="flex-1 border border-dashed border-white/10 rounded-3xl flex items-center justify-center text-white/20">Empty Deck B</div>
                )}
            </div>
            
            {/* Performance Pads / Footer */}
            <div className="h-[140px] rounded-2xl bg-[#080808] border-t border-white/5 flex items-center justify-between gap-12 shadow-2xl z-10 px-12 relative overflow-hidden">
                {/* Mesh Texture */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                
                {/* Left FX Grid */}
                <div className="flex gap-3 justify-center relative z-10">
                    <FXPad label="STUTTER" color="cyan" active={trackA?.fx_stutter} disabled={!trackA} onDown={() => trackA && setTrackFxStutter(trackA.id, true)} onUp={() => trackA && setTrackFxStutter(trackA.id, false)} />
                    <FXPad label="BRAKE" color="red" active={trackA?.fx_tape_stop} disabled={!trackA} onDown={() => trackA && setTrackFxTapeStop(trackA.id, true)} onUp={() => trackA && setTrackFxTapeStop(trackA.id, false)} />
                    <FXPad label="LOOP 4" color="yellow" active={trackA?.loop_enabled} disabled={!trackA} onDown={() => trackA && setTrackLoop(trackA.id, true, 4)} onUp={() => trackA && setTrackLoop(trackA.id, false)} />
                    <FXPad label="HORN" color="white" isTrigger disabled={false} onDown={() => audioEngine.triggerSample('horn')} onUp={() => {}} />
                </div>
                
                {/* Center Strip branding */}
                <div className="flex flex-col items-center justify-center gap-1 opacity-20">
                    <div className="w-32 h-[1px] bg-white"></div>
                    <span className="text-[10px] tracking-[0.5em] font-black uppercase">Performance</span>
                    <div className="w-32 h-[1px] bg-white"></div>
                </div>

                {/* Right FX Grid */}
                <div className="flex gap-3 justify-center relative z-10">
                    <FXPad label="STUTTER" color="pink" active={trackB?.fx_stutter} disabled={!trackB} onDown={() => trackB && setTrackFxStutter(trackB.id, true)} onUp={() => trackB && setTrackFxStutter(trackB.id, false)} />
                    <FXPad label="BRAKE" color="red" active={trackB?.fx_tape_stop} disabled={!trackB} onDown={() => trackB && setTrackFxTapeStop(trackB.id, true)} onUp={() => trackB && setTrackFxTapeStop(trackB.id, false)} />
                    <FXPad label="LOOP 4" color="orange" active={trackB?.loop_enabled} disabled={!trackB} onDown={() => trackB && setTrackLoop(trackB.id, true, 4)} onUp={() => trackB && setTrackLoop(trackB.id, false)} />
                    <FXPad label="SIREN" color="white" isTrigger disabled={false} onDown={() => audioEngine.triggerSample('siren')} onUp={() => {}} />
                </div>
            </div>
        </div>
    );
};

const FXPad = ({ label, color, onDown, onUp, disabled, active, isTrigger }: any) => {
    // Colors mapping
    const colorMap: any = {
        cyan: 'bg-cyan-500 shadow-cyan-500/50',
        red: 'bg-red-500 shadow-red-500/50',
        yellow: 'bg-yellow-500 shadow-yellow-500/50',
        pink: 'bg-pink-500 shadow-pink-500/50',
        orange: 'bg-orange-500 shadow-orange-500/50',
        white: 'bg-white shadow-white/50'
    };
    
    const glowClass = (active || isTrigger) ? colorMap[color] : 'bg-[#151515] border border-[#333]';
    const textClass = (active || isTrigger) ? 'text-black' : 'text-white/40';

    return (
        <button 
            disabled={disabled}
            className={`
                w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-100 ease-out
                ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : 'active:scale-95 active:brightness-110 cursor-pointer'}
                ${active ? `${glowClass} shadow-[0_0_20px_rgba(0,0,0,0.5)] border-transparent scale-[0.98]` : 'hover:border-white/20 bg-[#1a1a1a] shadow-lg border-white/5'}
            `}
            style={(active || isTrigger) ? {} : { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 0 rgba(0,0,0,0.5)' }} // 3D button look
            onMouseDown={disabled ? undefined : onDown}
            onMouseUp={disabled ? undefined : onUp}
            onMouseLeave={disabled ? undefined : onUp}
        >
            {/* Inner Light */}
            {(active || isTrigger) && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg"></div>}
            
            <span className={`font-black tracking-wider text-[9px] relative z-10 ${textClass}`}>{label}</span>
            
            {/* Status light strip */}
            <div className={`w-8 h-1 rounded-full ${active ? 'bg-black/50' : `bg-${color}-500/20`}`}></div>
        </button>
    )
}
