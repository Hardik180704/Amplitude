import React, { useState } from 'react';
import { useProjectStore } from '../store';
import { AudioContextManager } from '../audio/AudioContextManager';
import { Button } from './ui/Button';

// Icons (SVG)
const PlayIcon = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v12l10-6-10-6z"/></svg>;
const StopIcon = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h4v12H2V2zm8 0h4v12h-4V2z"/></svg>;

export const TopBar: React.FC = () => {
    const { project } = useProjectStore();
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSave = async () => { /* Same logic as before */ };
    const handleLoad = async () => { /* Same logic as before */ };

    const togglePlay = () => {
        if (isPlaying) {
             AudioContextManager.getInstance().sendCommand("Stop", {});
             setIsPlaying(false);
        } else {
             AudioContextManager.getInstance().sendCommand("Play", {});
             setIsPlaying(true);
        }
    };

    return (
        <div className="h-full px-4 flex items-center justify-between bg-bg-header text-text-primary select-none">
            {/* Left: Search & Menu */}
            <div className="flex items-center gap-4 w-1/3">
                <div className="flex items-center gap-2 text-text-muted hover:text-text-primary cursor-pointer transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span className="text-sm font-medium">Search</span>
                </div>
                
                 {/* File Actions */}
                <div className="flex gap-2">
                     <Button size="sm" variant="ghost" onClick={handleSave}>Save</Button>
                     <Button size="sm" variant="ghost" onClick={handleLoad}>Load</Button>
                </div>
            </div>

            {/* Center: Transport */}
            <div className="flex items-center justify-center gap-6 w-1/3">
                 <div className="flex items-center gap-2 bg-bg-panel px-4 py-2 rounded-full border border-border-subtle shadow-lg">
                    <button 
                         className={`p-2 rounded-full hover:bg-bg-hover transition-colors ${isPlaying ? 'text-accent-primary' : 'text-text-primary'}`}
                         onClick={togglePlay} // Changed from togglePlayback to togglePlay
                    >
                         {/* Play/Pause Icon */}
                         {isPlaying ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                         )}
                    </button>
                    
                    <button className="p-2 rounded-full hover:bg-bg-hover text-text-primary">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16"></rect></svg>
                    </button>
                    
                    <button className="p-2 rounded-full hover:bg-bg-hover text-accent-danger animate-pulse">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"></circle></svg>
                    </button>
                 </div>
                 
                 {/* Tempo */}
                 <div className="flex flex-col items-center">
                     <span className="text-xl font-mono font-bold text-text-primary">120</span>
                     <span className="text-[10px] text-text-secondary uppercase tracking-widest">BPM</span>
                 </div>
            </div>

            {/* Right: Time Display */}
            <div className="flex items-center justify-end gap-6 w-1/3">
                 <div className="text-4xl font-light font-mono text-text-primary tracking-tight">
                     01:20:00
                 </div>
                 <div className="text-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 </div>
            </div>
        </div>
    );
};
