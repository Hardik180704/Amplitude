import React, { useEffect, useRef } from 'react';
import { useProjectStore } from '../store';
import { Knob } from './ui/Knob';
import { audioEngine } from '../audio/AudioEngine';

const Meter = ({ trackId }: { trackId: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        // Shared buffer for reading metering data
        // We read ALL tracks at once, but for component isolation we'll just read ours
        // Optimization: In a real app, a central loop would read once and distribute.
        // For now, each meter reading the whole array is cheap (WASM copy).
        const meters = new Float32Array(32); // Max tracks assumption or dynamic resize

        const render = () => {
            audioEngine.readTrackMeters(meters);
            const level = meters[trackId] || 0; // Linear peak 0-1+
            
            // Draw Meter
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
            
            // Level
            // Logarithmic appearance approximation
            // const y = height - (Math.min(level, 1.0) * height);
            // Better visual: dB scale mapping
            // -60dB (0.001) to 0dB (1.0) -> height
            let yPercent = 0;
            if (level > 0.000001) {
                const db = 20 * Math.log10(level);
                // Map -60 to 6
                const minDb = -60;
                const maxDb = 6;
                yPercent = (db - minDb) / (maxDb - minDb);
            }
            yPercent = Math.max(0, Math.min(1, yPercent));
            
            
            const totalSegments = 32;
            const segmentHeight = height / totalSegments;
            const activeSegments = Math.floor(yPercent * totalSegments);
            
            for (let i = 0; i < totalSegments; i++) {
                const isLit = i < activeSegments;
                // Color calc - lower segments green, top red
                let color = '#22c55e'; // Green 500
                if (i > totalSegments * 0.6) color = '#eab308'; // Yellow 500
                if (i > totalSegments * 0.85) color = '#ef4444'; // Red 500
                
                ctx.fillStyle = isLit ? color : (i % 4 === 0 ? '#1e293b' : '#0f172a'); // Lit or dim background
                
                // Draw from bottom up
                const y = height - ((i + 1) * segmentHeight);
                // Leave 1px gap
                ctx.fillRect(1, y + 1, width - 2, segmentHeight - 1);
            }
            // Shadow / Glow
            if (activeSegments > totalSegments * 0.8) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ef4444';
            } else {
                ctx.shadowBlur = 0;
            }
            
            // Grid lines
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for(let i=1; i<10; i++) {
                ctx.fillRect(0, height * (i/10), width, 1);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [trackId]);

    return <canvas ref={canvasRef} width={6} height={160} className="rounded-full bg-slate-900 border border-slate-700" />;
}

const Crossfader = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
    return (
        <div className="h-20 border-t border-black flex items-center justify-center px-8 relative bg-[#0a0a0a]">
             {/* Labels (Engraved Look) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 select-none">A</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 select-none">B</div>
            
            <div className="relative w-full max-w-[320px] h-10 flex items-center justify-center">
                 {/* Track Background */}
                 <div className="absolute inset-x-0 h-2 bg-black rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,1)] border-b border-white/5"></div>
                 {/* Center Marker */}
                 <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white/20 rounded-full z-0"></div>

                 {/* Input (Invisible interactions) */}
                 <input 
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />

                {/* Visual Fader Cap */}
                <div 
                    className="absolute h-8 w-5 bg-gradient-to-b from-[#444] to-[#111] border border-black rounded shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-10 pointer-events-none flex items-center justify-center after:content-[''] after:w-[2px] after:h-[60%] after:bg-white after:shadow-[0_0_5px_white]"
                    style={{ 
                        left: `${((value + 1) / 2) * 100}%`,
                        transform: 'translateX(-50%)'
                    }}
                ></div>
            </div>
        </div>
    );
}

import { Deck } from './Deck';

const ChannelStrip = ({ track, selected, onSelect, updateTrack, setGroup }: any) => {
    const [showDeck, setShowDeck] = React.useState(false);

    return (
        <div 
            className={`flex-1 min-w-[120px] flex flex-col items-center h-full py-4 gap-2 transition-all duration-200 group/strip relative ${selected ? 'bg-white/5' : 'bg-transparent hover:bg-white/[0.02]'}`}
            onClick={() => onSelect(track.id)}
        >
            {/* Header / Deck Toggle */}
            <div className="w-full text-center px-2 flex flex-col gap-1 mb-2">
                <div className={`text-[9px] font-black uppercase truncate tracking-wider ${selected ? 'text-blue-400' : 'text-gray-500'}`}>
                    {track.name}
                </div>
                {/* Tiny Toggle */}
                <div className="flex gap-1 justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeck(!showDeck); }}
                        className="text-[8px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white/50"
                    >
                        {showDeck ? 'MIX' : 'DECK'}
                    </button>
                </div>
            </div>

            {showDeck ? (
                <div className="flex-1 w-full px-2 flex flex-col items-center justify-center">
                    <Deck trackId={track.id} size={90} />
                </div>
            ) : (
                <div className="flex flex-col w-full h-full items-center gap-1">
                
                {/* EQ Stack */}
                <div className="flex flex-col gap-3 p-2 rounded w-full items-center">
                    <Knob 
                        label="HIGH" 
                        value={track.eq?.high || 1.0} 
                        min={0} max={2.0} 
                        onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, high: v } })}
                        size={32}
                        color="#64748b"
                    />
                    <Knob 
                        label="MID" 
                        value={track.eq?.mid || 1.0} 
                        min={0} max={2.0} 
                        onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, mid: v } })}
                        size={32}
                        color="#64748b"
                    />
                    <Knob 
                        label="LOW" 
                        value={track.eq?.low || 1.0} 
                        min={0} max={2.0} 
                        onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, low: v } })}
                        size={32}
                        color="#64748b"
                    />
                </div>

                {/* Filter Knob (Big) */}
                <div className="py-2">
                     <Knob 
                        label="FILT" 
                        value={track.filter || 0} 
                        min={-1} max={1} 
                        onChange={(v) => updateTrack(track.id, { filter: v })}
                        size={40}
                        color={track.filter < 0 ? '#3b82f6' : (track.filter > 0 ? '#ef4444' : '#64748b')} 
                    />
                </div>
                
                {/* Fader Area */}
                <div className="flex-1 flex flex-row items-center justify-center gap-3 w-full px-2 relative min-h-[160px]">
                    {/* Meter (Slim) */}
                    <div className="h-full py-2">
                        <Meter trackId={track.id} />
                    </div>
                    
                    {/* Fader Track */}
                    <div className="h-full flex items-center justify-center py-2 relative w-8 group/fader">
                        {/* Slot */}
                        <div className="absolute top-2 bottom-2 left-1/2 -ml-[2px] w-[4px] bg-[#050505] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] border border-white/5"></div>
                        
                        {/* Tick Marks */}
                        <div className="absolute top-2 bottom-2 right-full mr-1 w-2 flex flex-col justify-between opacity-20">
                             {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-[1px] bg-white ml-auto"></div>)}
                        </div>

                        <input 
                            type="range" 
                            min={-60} 
                            max={6} 
                            step={0.1}
                            value={track.gain_db}
                            onChange={(e) => updateTrack(track.id, { gain_db: parseFloat(e.target.value) })}
                            className="appearance-none h-full w-full bg-transparent z-10 cursor-ns-resize opacity-0 absolute inset-0"
                            style={{ WebkitAppearance: 'slider-vertical' } as any}
                        />
                        
                        {/* Fader Cap */}
                        <div 
                            className="absolute left-1/2 -ml-3 w-6 h-10 bg-gradient-to-b from-[#333] to-[#111] border border-black rounded-[2px] shadow-[0_4px_8px_rgba(0,0,0,0.6)] pointer-events-none flex items-center justify-center after:content-[''] after:w-full after:h-[1px] after:bg-white/80 group-active/fader:bg-[#444] transition-colors"
                            style={{ 
                                bottom: `${Math.min(100, Math.max(0, ((track.gain_db - (-60)) / (6 - (-60))) * 100))}%`,
                                transform: 'translateY(50%)', 
                            }}
                        >
                        </div>
                    </div>
                </div>

                {/* Pan & buttons */}
                <div className="w-full flex justify-between px-2 pt-2 border-t border-white/5 mt-1">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setGroup(track.id, 'A'); }}
                        className={`text-[8px] font-black w-5 h-5 rounded flex items-center justify-center ${track.crossfaderGroup === 'A' ? 'bg-blue-500 text-white' : 'bg-[#111] text-gray-600 border border-white/5'}`}
                    >A</button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setGroup(track.id, 'B'); }}
                        className={`text-[8px] font-black w-5 h-5 rounded flex items-center justify-center ${track.crossfaderGroup === 'B' ? 'bg-pink-500 text-white' : 'bg-[#111] text-gray-600 border border-white/5'}`}
                    >B</button>
                </div>
            </div>
            )}
        </div>
    );
}

export const MixerPanel = () => {
    const { project, updateTrack, selectedTrackId, setSelectedTrack, crossfaderPosition, setCrossfaderPosition, setTrackCrossfaderGroup } = useProjectStore();

    return (
        <div className="h-full min-h-[500px] flex flex-col bg-transparent">
             {/* Tracks Container */}
            <div className="flex-1 overflow-x-auto flex flex-row divide-x divide-white/5">
                {project.tracks.map(track => (
                    <ChannelStrip 
                        key={track.id} 
                        track={track} 
                        selected={selectedTrackId === track.id}
                        onSelect={setSelectedTrack}
                        updateTrack={updateTrack}
                        setGroup={setTrackCrossfaderGroup}
                    />
                ))}
                
                {project.tracks.length === 0 && (
                    <div className="w-full flex items-center justify-center text-white/20 text-xs italic tracking-widest">
                        NO TRACKS ACTIVE
                    </div>
                )}
            </div>
            
            {/* Crossfader Section */}
            <Crossfader value={crossfaderPosition} onChange={setCrossfaderPosition} />
        </div>
    );
};
