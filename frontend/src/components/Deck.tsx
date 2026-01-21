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
        <div className="flex flex-col items-center gap-4 bg-[#111] p-4 rounded-xl border border-[#333]">
            {/* Platter */}
            <div 
                ref={wheelRef}
                className="relative rounded-full border-4 border-[#333] shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ 
                    width: size, 
                    height: size, 
                    transform: `rotate(${rotation}deg)`,
                    background: 'conic-gradient(from 0deg, #222 0%, #111 25%, #222 50%, #111 75%, #222 100%)'
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Vinyl Grooves */}
                <div className="absolute inset-2 border border-[#222] rounded-full opacity-50"></div>
                <div className="absolute inset-4 border border-[#222] rounded-full opacity-50"></div>
                <div className="absolute inset-8 border border-[#222] rounded-full opacity-50"></div>
                
                {/* Center Label (Art) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-blue-500 rounded-full flex items-center justify-center text-[8px] font-bold text-black border-4 border-white">
                    {track.name.slice(0, 3)}
                </div>
                
                {/* Marker */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-white/20 origin-bottom pointer-events-none"></div>
            </div>
            
            {/* Pitch Fader */}
            <div className="w-full flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-500">-8%</span>
                <input 
                    type="range"
                    min="0.92"
                    max="1.08"
                    step="0.001"
                    defaultValue="1.0"
                    onChange={handlePitchChange}
                    className="flex-1 h-1 bg-gray-700 appearance-none rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-500">+8%</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono">
                {((track.playbackRate || 1.0) * 100).toFixed(1)}%
            </div>
        </div>
    );
};
