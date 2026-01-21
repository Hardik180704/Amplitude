import React from 'react';
import { useProjectStore, type Effect } from '../store';
import { Knob } from './ui/Knob';
import { WebSocketManager } from '../api/WebSocketManager';

interface EffectRackProps {
    trackId: number;
}

const EffectUnit = ({ trackId, index, effect }: { trackId: number, index: number, effect: Effect }) => {
    const { updateEffect, removeEffect } = useProjectStore();

    const updateParam = (key: string, value: number) => {
        const newEffect = {
            ...effect,
            payload: { ...effect.payload, [key]: value }
        };
        // Optimistic update
        // @ts-ignore
        updateEffect(trackId, index, newEffect);
        
        // Network update
        WebSocketManager.getInstance().send('UpdateEffect', { track_id: trackId, index, effect: newEffect });
    };

    const handleRemove = () => {
        removeEffect(trackId, index);
        WebSocketManager.getInstance().send('RemoveEffect', { track_id: trackId, index });
    };

    const renderKnobs = () => {
        switch (effect.type) {
            case 'Eq':
                return (
                    <div className="flex gap-2">
                        <Knob label="Low" value={effect.payload.low_gain} min={-12} max={12} onChange={v => updateParam('low_gain', v)} />
                        <Knob label="Mid" value={effect.payload.mid_gain} min={-12} max={12} onChange={v => updateParam('mid_gain', v)} />
                        <Knob label="High" value={effect.payload.high_gain} min={-12} max={12} onChange={v => updateParam('high_gain', v)} />
                    </div>
                );
            case 'Compressor':
                return (
                    <div className="flex gap-2">
                        <Knob label="Thresh" value={effect.payload.threshold} min={-60} max={0} onChange={v => updateParam('threshold', v)} />
                        <Knob label="Ratio" value={effect.payload.ratio} min={1} max={20} onChange={v => updateParam('ratio', v)} />
                        <Knob label="Att" value={effect.payload.attack} min={0.1} max={100} onChange={v => updateParam('attack', v)} />
                        <Knob label="Rel" value={effect.payload.release} min={10} max={1000} onChange={v => updateParam('release', v)} />
                        <Knob label="Gain" value={effect.payload.makeup_gain} min={0} max={24} onChange={v => updateParam('makeup_gain', v)} />
                    </div>
                );
            case 'Delay':
                return (
                    <div className="flex gap-2">
                            <Knob label="Time" value={effect.payload.time_ms} min={10} max={2000} onChange={v => updateParam('time_ms', v)} />
                            <Knob label="Fdbk" value={effect.payload.feedback} min={0} max={1} step={0.01} onChange={v => updateParam('feedback', v)} />
                            <Knob label="Mix" value={effect.payload.mix} min={0} max={1} step={0.01} onChange={v => updateParam('mix', v)} />
                    </div>
                );
            case 'Reverb':
                 return (
                    <div className="flex gap-2">
                            <Knob label="Mix" value={effect.payload.mix} min={0} max={1} step={0.01} onChange={v => updateParam('mix', v)} />
                            <Knob label="Decay" value={effect.payload.decay} min={0.1} max={10} step={0.1} onChange={v => updateParam('decay', v)} />
                    </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="relative bg-bg-panel border border-border-subtle rounded shadow-knob mb-2 overflow-hidden group">
            {/* Pseudo-screw heads */}
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>

            {/* Header */}
            <div className="bg-metallic border-b border-border-subtle p-1.5 flex justify-between items-center">
                <span className="text-[10px] font-black text-text-muted tracking-widest uppercase ml-1">{effect.type}</span>
                <button onClick={handleRemove} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-danger hover:text-red-400 p-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            {/* Controls */}
            <div className="p-3 bg-gradient-to-b from-[#1a1a1d] to-[#141417]">
                 {renderKnobs()}
            </div>
        </div>
    );
};

export const EffectRack: React.FC<EffectRackProps> = ({ trackId }) => {
    const { project, addEffect } = useProjectStore();
    const track = project.tracks.find(t => t.id === trackId);

    if (!track) return null;

    const handleAdd = (type: Effect['type']) => {
        let newEffect: Effect;
        if (type === 'Eq') newEffect = { type: 'Eq', payload: { low_gain: 0, mid_gain: 0, high_gain: 0 }};
        else if (type === 'Compressor') newEffect = { type: 'Compressor', payload: { threshold: -20, ratio: 4, attack: 10, release: 100, makeup_gain: 0 }};
        else if (type === 'Delay') newEffect = { type: 'Delay', payload: { time_ms: 300, feedback: 0.4, mix: 0.5 }};
        else if (type === 'Reverb') newEffect = { type: 'Reverb', payload: { mix: 0.5, decay: 2.0 }};
        else return;
        
        addEffect(trackId, newEffect);
        WebSocketManager.getInstance().send('AddEffect', { track_id: trackId, effect: newEffect });
    };

    return (
        <div className="h-full flex flex-col bg-bg-panel border-l border-border-subtle shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)] z-20">
            <div className="p-3 border-b border-border-subtle bg-bg-header flex justify-between items-center bg-metallic">
                <h3 className="text-[10px] font-black text-accent-primary tracking-[0.2em] uppercase">FX CHAIN / <span className="text-text-muted">TRK {trackId}</span></h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 content-start">
                {track.effects.length === 0 && (
                     <div className="h-24 border-2 border-dashed border-border-subtle rounded flex items-center justify-center text-xs text-text-muted">
                        No Effects Loaded
                    </div>
                )}
                {track.effects.map((effect, i) => (
                    <EffectUnit key={i} trackId={trackId} index={i} effect={effect} />
                ))}
            </div>
            
            <div className="p-3 border-t border-border-subtle bg-bg-header">
                <div className="grid grid-cols-4 gap-1">
                     <button className="text-[10px] bg-bg-main border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors py-1 rounded" onClick={() => handleAdd('Eq')}>EQ</button>
                     <button className="text-[10px] bg-bg-main border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors py-1 rounded" onClick={() => handleAdd('Compressor')}>CMP</button>
                     <button className="text-[10px] bg-bg-main border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors py-1 rounded" onClick={() => handleAdd('Delay')}>DLY</button>
                     <button className="text-[10px] bg-bg-main border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors py-1 rounded" onClick={() => handleAdd('Reverb')}>VRB</button>
                </div>
            </div>
        </div>
    );
};
