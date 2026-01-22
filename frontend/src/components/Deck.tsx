import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../store';
import { audioEngine } from '../audio/AudioEngine';

interface DeckProps {
    trackId: number;
    size?: number;
}

export const Deck: React.FC<DeckProps> = ({ trackId, size = 200 }) => {
    const { updateTrack, project } = useProjectStore();
    const track = project.tracks.find(t => t.id === trackId);
    
    const wheelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [rotation, setRotation] = useState(0);
    const lastY = useRef(0);
    
    // Animation Loop for spinning Platter
    useEffect(() => {
        let animationFrame: number;
        
        const animate = () => {
            const isPlaying = useProjectStore.getState().isPlaying;
            if (isPlaying && !isDragging) {
                // 33 1/3 RPM = ~200 deg per second
                setRotation(r => (r + 2) % 360);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastY.current = e.clientY;
        // Pause motor
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - lastY.current;
        lastY.current = e.clientY;
        
        // Calculate Scratch Velocity (inverted: pulling down = forward? usually pushing up = forward)
        // Let's say pulling down (positive delta) = backspin (-), pushing up = forward (+).
        const sensitivity = 0.05;
        const velocity = -deltaY * sensitivity;
        
        audioEngine.setTrackScratch(trackId, velocity);
        
        // Visual Rotation
        setRotation(r => r + velocity * 10);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        audioEngine.setTrackScratch(trackId, 0);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        updateTrack(trackId, { playbackRate: val });
    };

    if (!track) return null;

    return (
        <div className="flex flex-col items-center gap-6 relative group">
            
            {/* Platter Container (Turntable Base highlight) */}
            <div className="relative rounded-full p-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white/10 to-transparent">
                <div className="bg-[#050505] rounded-full p-1">
                    {/* Rotating Platter */}
                    <div 
                        ref={wheelRef}
                        className="relative rounded-full overflow-hidden cursor-grab active:cursor-grabbing shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                        style={{ 
                            width: size, 
                            height: size, 
                            transform: `rotate(${rotation}deg)`,
                            // Authentic Vinyl Grooves: Conic for shine + Repeating Radial for grooves
                            background: `
                                radial-gradient(circle, #000 28%, transparent 28.5%),
                                radial-gradient(circle, #000 30%, transparent 30.5%),
                                repeating-radial-gradient(
                                    #111 0, 
                                    #111 2px, 
                                    #080808 3px, 
                                    #080808 4px
                                ),
                                conic-gradient(from 0deg, #111 0%, #333 10%, #111 25%, #222 50%, #111 75%, #333 90%, #111 100%)
                            `,
                            backgroundBlendMode: 'normal, normal, overlay, normal'
                        }}
                        onMouseDown={handleMouseDown}
                    >
                        {/* Strobe Dots (Outer Ring) */}
                        <div className="absolute inset-2 border-[4px] border-dashed border-white/5 rounded-full opacity-30"></div>

                        {/* Glossy Reflection Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-full"></div>

                        {/* Center Label (Art) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.8)] border border-white/10 flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-sm z-10">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80 mix-blend-multiply"></div>
                             {/* Label Text spinning with record */}
                             <div className="relative z-10 text-[8px] font-black tracking-widest text-white/80 rotate-90">
                                 AMPLITUDE
                             </div>
                             {/* Spindle */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full shadow-inner border border-gray-400"></div>
                        </div>
                        
                        {/* Playhead Marker (Sticker) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[50%] bg-white/40 origin-bottom pointer-events-none z-20"></div>
                    </div>
                </div>
            </div>
            
            {/* Pitch Fader (Technics Style) */}
            <div className="w-full flex flex-col gap-1 items-center px-4">
                 <div className="flex justify-between w-full text-[9px] font-mono text-white/30 tracking-widest">
                     <span>-8%</span>
                     <span className={`${(track.playbackRate || 1.0) !== 1.0 ? 'text-blue-400 animate-pulse' : ''}`}>
                        {((track.playbackRate || 1.0) * 100).toFixed(1)}%
                     </span>
                     <span>+8%</span>
                 </div>
                 
                 <div className="relative w-full h-8 flex items-center group/fader">
                    {/* Track */}
                    <div className="absolute inset-x-0 h-1 bg-black/50 border-b border-white/5 rounded-full"></div>
                    {/* Center Detent */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-white/20 rounded-full"></div>
                    
                    <input 
                        type="range"
                        min="0.92"
                        max="1.08"
                        step="0.001"
                        defaultValue="1.0"
                        onChange={handlePitchChange}
                        className="relative z-10 w-full h-8 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-[0_2px_5px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 hover:[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:transition-colors"
                    />
                 </div>
            </div>
        </div>
    );
};
