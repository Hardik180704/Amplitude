import { useProjectStore } from '../store';
import { Knob } from './ui/Knob';

export const MixerPanel = () => {
    const { project } = useProjectStore();

    return (
        <div className="h-full flex flex-col bg-bg-panel border-l border-border-subtle">
            <div className="h-10 px-4 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted tracking-wider">CHANNELS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {project.tracks.map(track => (
                    <div key={track.id} className="group p-3 bg-bg-main rounded border border-border-subtle hover:border-accent-primary transition-colors flex items-center justify-between">
                        {/* Track Info */}
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${track.muted ? 'bg-text-muted' : 'bg-accent-success'}`} />
                            <div>
                                <div className="text-xs font-medium text-text-primary">{track.name}</div>
                                <div className="text-[10px] text-text-secondary">Vol: {track.gain_db.toFixed(1)} dB</div>
                            </div>
                        </div>
                        
                        {/* Controls (Mini) */}
                        <div className="flex items-center gap-2">
                             {/* Mock Volume Knob */}
                            <Knob 
                                value={track.gain_db} 
                                min={-60} 
                                max={6} 
                                onChange={() => {}} 
                                size={24}
                                label=""
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
