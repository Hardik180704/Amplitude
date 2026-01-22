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
        <div className="w-full h-16 bg-[#111] border-t border-[#333] flex items-center justify-center px-8 relative">
            <div className="absolute left-4 text-xs font-bold text-gray-500">A</div>
            <div className="absolute right-4 text-xs font-bold text-gray-500">B</div>
            
            <input 
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full max-w-[400px] h-8 appearance-none bg-transparent cursor-pointer z-10"
                style={{
                    // Custom styles for crossfader feel
                }}
            />
            {/* Visual Track */}
            <div className="absolute w-full max-w-[400px] h-2 bg-[#222] rounded-full pointer-events-none">
                 <div className="absolute top-0 bottom-0 bg-[#444] rounded-full" 
                      style={{ 
                          left: '50%', 
                          width: '2px',
                          transform: 'translateX(-50%)'
                      }} 
                 />
            </div>
        </div>
    );
}

import { Deck } from './Deck';

const ChannelStrip = ({ track, selected, onSelect, updateTrack, setGroup }: any) => {
    const [showDeck, setShowDeck] = React.useState(false);

    return (
        <div 
            className={`flex flex-col items-center h-full w-[140px] shrink-0 border-r border-white/5 py-4 gap-2 transition-all duration-200 ${selected ? 'bg-[#131b2c] shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' : 'bg-transparent'}`}
            onClick={() => onSelect(track.id)}
        >
            {/* Header / Deck Toggle */}
            <div className="w-full text-center px-1 flex flex-col gap-1">
                <div className={`text-[10px] font-bold uppercase truncate ${selected ? 'text-blue-400' : 'text-gray-400'}`}>
                    {track.name}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowDeck(!showDeck); }}
                    className={`text-[8px] px-2 py-0.5 rounded border ${showDeck ? 'bg-blue-500 text-white border-blue-400' : 'bg-transparent text-gray-500 border-gray-600'}`}
                >
                    {showDeck ? 'MIX' : 'DECK'}
                </button>
            </div>

            {showDeck ? (
                <div className="flex-1 w-full px-2 flex flex-col items-center justify-center">
                    <Deck trackId={track.id} size={100} />
                </div>
            ) : (
                <>
                {/* EQ Section */}
                <div className="flex flex-col gap-2 p-2 bg-[#0e121b] rounded-lg border border-white/5 shadow-inner w-full items-center">
                    <span className="text-[9px] text-gray-500 font-bold mb-1 w-full text-center border-b border-white/5 pb-1">EQ</span>
                <Knob 
                    label="HIGH" 
                    value={track.eq?.high || 1.0} 
                    min={0} max={2.0} 
                    onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, high: v } })}
                    size={40}
                />
                <Knob 
                    label="MID" 
                    value={track.eq?.mid || 1.0} 
                    min={0} max={2.0} 
                    onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, mid: v } })}
                    size={40}
                />
                <Knob 
                    label="LOW" 
                    value={track.eq?.low || 1.0} 
                    min={0} max={2.0} 
                    onChange={(v) => updateTrack(track.id, { eq: { ...track.eq, low: v } })}
                    size={40}
                />
            </div>

            {/* Filter Section */}
            <div className="flex flex-col gap-1 items-center pb-2 w-full pt-2">
                 <Knob 
                    label="FILTER" 
                    value={track.filter || 0} 
                    min={-1} max={1} 
                    onChange={(v) => updateTrack(track.id, { filter: v })}
                    size={48}
                    color="#f43f5e" // Rose color for filter
                />
            </div>
            </>
            )}

            {/* Fader Area */}
            <div className={`flex-1 flex flex-row items-center justify-center gap-2 w-full px-2 relative ${showDeck ? 'h-32 grow-0' : 'min-h-[200px]'}`}>
                {/* Meter */}
                <Meter trackId={track.id} />
                
                {/* Fader */}
                <div className="h-full flex items-center justify-center py-2 group relative w-10">
                    {/* Track Slot */}
                    <div className="absolute top-2 bottom-2 left-1/2 -ml-[1px] w-[2px] bg-[#000] rounded-full shadow-[inset_0_0_2px_rgba(0,0,0,1)]"></div>
                    
                    {/* Tick Marks (Canvas or simple divs) */}
                    <div className="absolute top-2 bottom-2 left-1.5 w-[1px] flex flex-col justify-between opacity-30">
                        {[...Array(11)].map((_, i) => <div key={i} className="w-1 h-[1px] bg-white"></div>)}
                    </div>

                    <input 
                        type="range" 
                        min={-60} 
                        max={6} 
                        step={0.1}
                        value={track.gain_db}
                        onChange={(e) => updateTrack(track.id, { gain_db: parseFloat(e.target.value) })}
                        className="appearance-none h-full w-full bg-transparent z-10 cursor-pointer opacity-0"
                        style={{ WebkitAppearance: 'slider-vertical' } as any}
                    />
                    
                    {/* Custom Fader Cap (Visual Only, follows inputs via calculation if needed, but for now we rely on input's thumb or basic styling) */}
                    {/* Actually, native vertical range input is hard to style perfectly across browsers. 
                        Let's implement a custom drag logic like Knob if we want perfection.
                        For speed/reliability now: Styled Range Input + Visual Track. 
                    */}
                    <div 
                        className="absolute left-1/2 -ml-3 w-6 h-10 bg-gradient-to-b from-[#333] to-[#111] border border-black rounded shadow-xl pointer-events-none flex items-center justify-center after:content-[''] after:w-full after:h-[1px] after:bg-white/50"
                        style={{ 
                            bottom: `${Math.min(100, Math.max(0, ((track.gain_db - (-60)) / (6 - (-60))) * 100))}%`,
                            transform: 'translateY(50%)', // Center on point
                            boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                        }}
                    >
                    </div>
                </div>
            </div>

            {/* Pan & Mute/Solo/Cue */}
            <div className="flex flex-col gap-2 w-full px-2 items-center">
                 <Knob 
                    label="PAN" 
                    value={track.pan} 
                    min={-1} max={1} 
                    onChange={(v) => updateTrack(track.id, { pan: v })}
                    size={24}
                />
                
                <div className="flex gap-1 w-full justify-center">
                    <button 
                        onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                        className={`text-[9px] w-6 h-6 rounded flex items-center justify-center font-bold transition-all border ${track.muted ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-[#222] text-gray-500 border-gray-700 hover:border-gray-500'}`}
                    >
                        M
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { soloed: !track.soloed }); }}
                        className={`text-[9px] w-6 h-6 rounded flex items-center justify-center font-bold transition-all border ${track.soloed ? 'bg-blue-500 text-white border-blue-400' : 'bg-[#222] text-gray-500 border-gray-700 hover:border-gray-500'}`}
                    >
                        S
                    </button>
                    {/* CUE Button (Placeholder for now acting as visual) */}
                     <button 
                        className={`text-[9px] w-6 h-6 rounded flex items-center justify-center font-bold transition-all border bg-[#222] text-gray-500 border-gray-700 hover:border-gray-500 opacity-50 cursor-not-allowed`}
                        title="Cue (Coming Soon)"
                    >
                        P
                    </button>
                </div>
                
                {/* Crossfader Assignment */}
                <div className="flex w-full bg-[#111] rounded border border-[#333] overflow-hidden">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setGroup(track.id, 'A'); }}
                        className={`flex-1 text-[8px] py-1 font-bold ${track.crossfaderGroup === 'A' ? 'bg-gray-200 text-black' : 'text-gray-500 hover:bg-[#222]'}`}
                    >A</button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setGroup(track.id, 'Thru'); }}
                        className={`flex-1 text-[8px] py-1 font-bold border-x border-[#333] ${!track.crossfaderGroup || track.crossfaderGroup === 'Thru' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-[#222]'}`}
                    >THRU</button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setGroup(track.id, 'B'); }}
                        className={`flex-1 text-[8px] py-1 font-bold ${track.crossfaderGroup === 'B' ? 'bg-gray-200 text-black' : 'text-gray-500 hover:bg-[#222]'}`}
                    >B</button>
                </div>
            </div>
            
            {/* DB Value logic */}
            <div className="mt-2 text-[9px] font-mono text-blue-400 bg-black/40 px-2 py-0.5 rounded border border-blue-900/30">
                {track.gain_db.toFixed(1)} dB
            </div>
        </div>
    );
}

export const MixerPanel = () => {
    const { project, updateTrack, selectedTrackId, setSelectedTrack, crossfaderPosition, setCrossfaderPosition, setTrackCrossfaderGroup } = useProjectStore();

    return (
        <div className="h-full min-h-[500px] flex flex-col bg-[#111] border-l border-[#333]">
            <div className="h-8 shrink-0 px-4 border-b border-[#333] flex items-center justify-between bg-[#18181b]">
                <span className="text-[10px] font-black text-gray-500 tracking-[0.2em]">MIXER</span>
            </div>
            
            <div className="flex-1 overflow-x-auto flex flex-row">
                 {/* Master Strip Placeholder */}
                 
                 {/* Track Strips */}
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
                    <div className="w-full flex items-center justify-center text-gray-600 text-xs italic">
                        No Tracks
                    </div>
                )}
            </div>
            
            {/* Crossfader Section */}
            <Crossfader value={crossfaderPosition} onChange={setCrossfaderPosition} />
        </div>
    );
};
