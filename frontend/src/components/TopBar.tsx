import React, { useState } from 'react';
import { useProjectStore } from '../store';
import { AudioContextManager } from '../audio/AudioContextManager';
import { Button } from './ui/Button';

// Icons (SVG)
const PlayIcon = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v12l10-6-10-6z"/></svg>;
const StopIcon = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h4v12H2V2zm8 0h4v12h-4V2z"/></svg>;

export const TopBar: React.FC = () => {
    const { project, setProject } = useProjectStore();
    const [status, setStatus] = useState<string>('');
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
        <div className="h-full w-full flex items-center justify-between px-4 select-none">
            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-6">
                <div className="font-bold text-accent-primary tracking-tight text-lg shadow-glow">
                    AMPLITUDE
                </div>
                <div className="flex gap-2 text-sm text-text-secondary">
                    <span className="hover:text-text-primary cursor-pointer transition-colors">File</span>
                    <span className="hover:text-text-primary cursor-pointer transition-colors">Edit</span>
                    <span className="hover:text-text-primary cursor-pointer transition-colors">View</span>
                </div>
            </div>

            {/* Center: Transport */}
            <div className="flex items-center gap-4 bg-bg-panel px-4 py-1.5 rounded-full border border-border-subtle shadow-sm">
                <div className="flex gap-2">
                     <Button 
                        size="sm" 
                        variant={isPlaying ? "danger" : "primary"}
                        onClick={togglePlay}
                        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
                     >
                         {isPlaying ? <StopIcon /> : <PlayIcon />}
                     </Button>
                </div>
                
                {/* Time Display */}
                <div className="flex flex-col items-center w-24 bg-bg-main rounded px-2 py-0.5 border border-border-subtle group cursor-pointer hover:border-accent-primary/30 transition-colors">
                    <span className="text-lg font-mono leading-none text-accent-primary">00:00:00</span>
                    <span className="text-[9px] text-text-muted font-mono">01.01.00</span>
                </div>
                
                {/* BPM & Signature */}
                <div className="flex gap-4 px-2 border-l border-border-subtle">
                     <div className="flex flex-col items-center">
                         <span className="text-sm font-bold text-text-primary h-4">{project.tempo}</span>
                         <span className="text-[9px] text-text-muted">BPM</span>
                     </div>
                     <div className="flex flex-col items-center">
                         <span className="text-sm font-bold text-text-primary h-4">4/4</span>
                         <span className="text-[9px] text-text-muted">SIG</span>
                     </div>
                </div>
            </div>

            {/* Right: Project Actions */}
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleSave}>Save</Button>
                <Button variant="secondary" size="sm" onClick={handleLoad}>Load</Button>
                <div className="w-24 text-right text-xs text-text-muted truncate">
                    {status}
                </div>
            </div>
        </div>
    );
};
