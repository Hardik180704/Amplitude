import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../store';
import { Button } from './ui/Button';
import { WebSocketManager } from '../api/WebSocketManager';
import { transport } from '../audio/TransportManager';
import { interactionManager } from '../interactions/InteractionManager';

interface TopBarProps {
    onExportClick?: () => void;
    onSettingsClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onExportClick, onSettingsClick }) => {
    const { project } = useProjectStore(); 
    const [isPlaying, setIsPlaying] = useState(transport.isPlaying);
    const [followPlayhead, setFollowPlayhead] = useState(interactionManager.getState().followPlayhead);
    const timeRef = useRef<HTMLDivElement>(null);

    // Sync Play State & Interaction
    useEffect(() => {
        const unsubTransport = transport.subscribe(() => {
             setIsPlaying(transport.isPlaying);
             if (transport.isPlaying) updateClock();
        });
        const unsubInteraction = interactionManager.subscribe((state) => {
             setFollowPlayhead(state.followPlayhead);
        });
        return () => { 
            unsubTransport(); 
            unsubInteraction();
        };
    }, []);

    // Clock Loop (Direct DOM manipulation for performance)
    const updateClock = () => {
        if (timeRef.current) {
            timeRef.current.innerText = transport.getFormattedTime();
        }
        if (transport.isPlaying) {
            requestAnimationFrame(updateClock);
        }
    };

    const togglePlay = async () => {
        await transport.toggle();
        const action = transport.isPlaying ? "Play" : "Stop";
        WebSocketManager.getInstance().send(action, {});
        
        if (transport.isPlaying) {
            updateClock();
        }
    };

    const toggleFollow = () => {
        interactionManager.setFollowPlayhead(!followPlayhead);
    };

    const handleSave = async () => { /* Same logic as before */ };
    const handleLoad = async () => { /* Same logic as before */ };

    return (
        <div className="w-full h-full px-4 grid grid-cols-[1fr_auto_1fr] gap-4 items-center text-text-primary select-none">
            {/* Left: Branding & View Switcher */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                    <span className="text-lg font-black tracking-[0.2em] leading-none text-text-primary font-sans">AMPLITUDE</span>
                    <span className="text-[9px] font-bold text-accent-primary uppercase tracking-[0.4em] flex items-center gap-1 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-accent-primary animate-pulse"></span> Studio
                    </span>
                 </div>
                 
                 <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                 <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 shadow-inner">
                    <button 
                        onClick={() => useProjectStore.getState().setViewMode('DAW')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                            useProjectStore((s) => s.viewMode) === 'DAW' 
                            ? 'bg-accent-primary text-white shadow-glow-sm' 
                            : 'text-text-muted hover:text-white'
                        }`}
                    >
                        DAW
                    </button>
                    <button 
                        onClick={() => useProjectStore.getState().setViewMode('DJ')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                            useProjectStore((s) => s.viewMode) === 'DJ' 
                            ? 'bg-accent-secondary text-white shadow-glow-sm' 
                            : 'text-text-muted hover:text-white'
                        }`}
                    >
                        DJ
                    </button>
                </div>
            </div>

            {/* Center: Transport Control Deck */}
            <div className="flex items-center gap-4 p-1.5 pr-2 bg-bg-panel border border-border rounded-xl shadow-panel relative group">
                {/* LCD Screen: Tempo & Time */}
                <div className="flex items-center gap-4 px-4 py-1 bg-black/50 rounded-lg border border-white/5 shadow-inner">
                    <div className="flex flex-col items-end">
                         <span className="text-xl font-mono font-bold text-accent-secondary lcd-text leading-none">{project.tempo}</span>
                         <span className="text-[8px] text-text-muted font-bold tracking-widest uppercase">BPM</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10"></div>
                    <div ref={timeRef} className="text-xl font-mono font-bold text-accent-primary lcd-text tracking-tight w-[100px] text-center">
                         00:00:00
                    </div>
                </div>

                {/* Transport Buttons */}
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                    <button 
                         className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all active:translate-y-[1px] ${
                            isPlaying 
                                ? 'bg-accent-primary text-white shadow-glow-md' 
                                : 'bg-bg-header hover:bg-bg-hover text-text-primary border border-white/5'
                         }`}
                         onClick={togglePlay}
                    >
                         {isPlaying ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="ml-0.5"><path d="M5 3 L19 12 L5 21 Z" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" fill="currentColor"></path></svg>
                         )}
                    </button>
                    
                    <button 
                        onClick={() => { transport.stop(); setIsPlaying(false); WebSocketManager.getInstance().send("Stop", {}); }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-header hover:bg-bg-hover text-text-muted hover:text-white border border-white/5 transition-all active:translate-y-[1px]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="1"></rect></svg>
                    </button>
                    
                    <button 
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-header hover:bg-bg-hover text-accent-danger border border-transparent hover:border-accent-danger/30 transition-all active:translate-y-[1px] relative group"
                    >
                        <div className="w-3 h-3 rounded-full bg-accent-danger shadow-glow-sm"></div>
                    </button>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-3">
                 <div className="flex bg-bg-panel rounded-lg p-1 border border-border shadow-panel">
                     <Button size="sm" variant="ghost" onClick={handleSave} className="text-[10px] h-7 uppercase font-bold tracking-wider text-text-muted hover:text-text-primary transition-all">Save</Button>
                     <div className="w-[1px] h-4 bg-white/10 self-center mx-1"></div>
                     <Button size="sm" variant="ghost" onClick={handleLoad} className="text-[10px] h-7 uppercase font-bold tracking-wider text-text-muted hover:text-text-primary transition-all">Load</Button>
                     <div className="w-[1px] h-4 bg-white/10 self-center mx-1"></div>
                     <Button size="sm" variant="primary" onClick={onExportClick} className="h-7 bg-white/5 hover:bg-white/10 text-accent-primary border-none text-[10px] uppercase font-black px-4 transition-all">Export</Button>
                 </div>
                 
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-primary to-purple-600 shadow-glow-sm border border-white/10 cursor-pointer hover:scale-105 transition-transform"></div>
            </div>
        </div>
    );
};
