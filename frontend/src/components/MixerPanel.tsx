import { useProjectStore } from '../store';
import { Knob } from './ui/Knob';

import { WebSocketManager } from '../api/WebSocketManager';

export const MixerPanel = () => {
    const { project, updateTrack, selectedTrackId, setSelectedTrack } = useProjectStore();

    const handleVolumeChange = (trackId: number, val: number) => {
        // Optimistic update
        updateTrack(trackId, { gain_db: val });
        // Send to backend
        WebSocketManager.getInstance().send('UpdateTrack', { id: trackId, gain_db: val });
    };

    return (
        <div className="h-full flex flex-col bg-bg-panel border-l border-border-subtle">
            <div className="h-10 px-4 border-b border-border-subtle flex items-center justify-between bg-metallic">
                <span className="text-[10px] font-black text-text-muted tracking-[0.2em]">CHANNELS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {project.tracks.map(track => {
                    const isSelected = selectedTrackId === track.id;
                    return (
                        <div 
                            key={track.id} 
                            className={`group p-2 rounded transition-all flex items-center justify-between cursor-pointer border ${
                                isSelected 
                                    ? 'bg-[#18181b] border-accent-primary/40 shadow-[0_0_15px_-5px_rgba(225,29,72,0.3)]' 
                                    : 'bg-bg-main border-border-subtle hover:border-border-focus'
                            }`}
                            onClick={() => setSelectedTrack(track.id)}
                        >
                            {/* Track Info */}
                            <div className="flex items-center gap-3">
                                {/* Status LED */}
                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${
                                    track.muted ? 'text-text-muted bg-text-muted' : 'text-accent-success bg-accent-success'
                                }`} />
                                
                                <div>
                                    <div className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-accent-primary' : 'text-text-secondary'}`}>
                                        {track.name}
                                    </div>
                                    <div className="text-[9px] font-mono text-text-muted">
                                        {track.gain_db > 0 ? '+' : ''}{track.gain_db.toFixed(1)} dB
                                    </div>
                                </div>
                            </div>
                            
                            {/* Controls (Mini) */}
                            <div className="flex items-center gap-2">
                                <Knob 
                                    value={track.gain_db} 
                                    min={-60} 
                                    max={6} 
                                    onChange={(val) => handleVolumeChange(track.id, val)} 
                                    size={28}
                                    label=""
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
