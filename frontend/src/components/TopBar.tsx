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
        <div className="w-full h-full px-6 grid grid-cols-[1fr_auto_1fr] gap-8 items-center text-text-primary select-none bg-bg-header/60 backdrop-blur-md border-b border-white/5">
            {/* Left: Search & Menu */}
            <div className="flex items-center gap-6 justify-start min-w-0 pointer-events-auto">
                 {/* Logo */}
                 <div className="flex items-center gap-4 pr-6 border-r border-white/10 mr-2 group cursor-pointer">
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black tracking-[0.2em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 font-sans">AMPLITUDE</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-accent-primary/80 uppercase tracking-[0.4em] flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-accent-primary animate-pulse"></span>
                                Studio
                            </span>
                        </div>
                    </div>
                 </div>

                <div className="flex items-center gap-3 text-text-secondary hover:text-text-primary cursor-pointer transition-colors group whitespace-nowrap">
                     <div className="p-1.5 rounded-md bg-white/5 ring-1 ring-white/5 group-hover:bg-white/10 group-hover:ring-white/10 transition-all shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                     </div>
                    <span className="text-xs font-bold tracking-[0.1em] uppercase opacity-70 group-hover:opacity-100 transition-opacity hidden xl:inline">Search</span>
                </div>

                {/* View Toggle */}
                <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                <div className="flex bg-[#09090b] rounded-lg p-0.5 border border-white/10 shadow-inner">
                    <button 
                        onClick={() => useProjectStore.getState().setViewMode('DAW')}
                        className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                            useProjectStore((s) => s.viewMode) === 'DAW' 
                            ? 'bg-accent-primary text-white shadow-sm' 
                            : 'text-text-muted hover:text-white'
                        }`}
                    >
                        DAW
                    </button>
                    <button 
                        onClick={() => useProjectStore.getState().setViewMode('DJ')}
                        className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                            useProjectStore((s) => s.viewMode) === 'DJ' 
                            ? 'bg-accent-primary text-white shadow-sm' 
                            : 'text-text-muted hover:text-white'
                        }`}
                    >
                        DJ
                    </button>
                </div>
                
                {/* Divider */}
                <div className="h-4 w-[1px] bg-white/10"></div>
                
                <div className="flex gap-2">
                     <Button size="sm" variant="ghost" onClick={handleSave} className="text-[10px] uppercase font-bold tracking-wider text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">Save</Button>
                     <Button size="sm" variant="ghost" onClick={handleLoad} className="text-[10px] uppercase font-bold tracking-wider text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">Load</Button>
                     <Button size="sm" variant="primary" onClick={onExportClick} className="ml-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary hover:text-white hover:border-accent-primary shadow-[0_0_15px_-5px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_-5px_rgba(225,29,72,0.6)] text-[10px] uppercase tracking-widest font-black py-1 px-4 transition-all">Export</Button>
                </div>
            </div>

            {/* Center: Transport Island */}
            <div className="flex items-center justify-center relative z-20">
                 <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#09090b] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl relative group">
                    <button 
                         className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 relative z-10 active:scale-95 ${
                            isPlaying 
                                ? 'bg-accent-primary text-white shadow-[0_0_30px_-5px_rgba(225,29,72,0.6),inset_0_2px_10px_rgba(255,255,255,0.2)] scale-105' 
                                : 'bg-[#18181b] text-text-primary hover:bg-[#27272a] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]'
                         }`}
                         onClick={togglePlay}
                    >
                         {isPlaying ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="drop-shadow-md"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="ml-1 drop-shadow-md"><path d="M5 3 L19 12 L5 21 Z" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" fill="currentColor"></path></svg>
                         )}
                    </button>
                    
                    <div className="flex items-center gap-1 px-1">
                        {/* Follow Button */}
                        <button 
                            onClick={toggleFollow}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                                followPlayhead ? 'text-accent-primary bg-accent-primary/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                            }`}
                            title="Follow Playhead"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                        </button>

                        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all active:scale-95">
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="1"></rect></svg>
                        </button>
                        
                        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 text-accent-danger/70 hover:text-accent-danger transition-all relative group active:scale-95">
                            <div className="absolute inset-0 bg-accent-danger/10 rounded-full animate-pulse opacity-0 group-hover:opacity-100"></div>
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="8"></circle></svg>
                        </button>
                    </div>
                 </div>
            </div>

            {/* Right: Info & Settings */}
            <div className="flex items-center justify-end gap-6 justify-self-end h-full">
                 {/* Tempo Display */}
                 <div className="flex flex-col items-end justify-center h-full px-4 border-r border-white/5">
                     <span className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 leading-none">{project.tempo}</span>
                     <span className="text-[9px] text-[#52525b] font-black uppercase tracking-[0.2em] relative top-[2px]">BPM</span>
                 </div>

                 {/* Time Display */}
                 <div className="flex items-center gap-4">
                     <div ref={timeRef} className="text-4xl font-light font-mono text-accent-primary tracking-tight leading-none" style={{ textShadow: "0 0 20px rgba(225, 29, 72, 0.2)" }}>
                         00:00:00
                     </div>
                 </div>

                 {/* Divider */}
                 <div className="h-8 w-[1px] bg-white/10"></div>

                 {/* Settings / Profile */}
                 <div className="flex items-center gap-3 pl-2">
                     <button onClick={onSettingsClick} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                     </button>
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary to-purple-500 shadow-lg ring-2 ring-white/10 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"></div>
                 </div>
            </div>
        </div>
    );
};
