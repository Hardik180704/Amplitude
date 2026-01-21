import React from 'react';
import { Panel } from './ui/Panel';

export const LibraryPanel: React.FC = () => {
    return (
        <div className="h-full p-2 flex flex-col gap-2">
            <Panel title="Browser" className="flex-1">
                <div className="p-2 text-xs text-text-secondary font-mono">
                    <div>▶ Drums</div>
                    <div className="pl-2 text-text-muted">Kick_808.wav</div>
                    <div className="pl-2 text-text-muted">Snare_Trap.wav</div>
                    <div className="pl-2 text-text-muted">Hat_Closed.wav</div>
                    <div>▶ Bass</div>
                    <div>▶ FX</div>
                </div>
            </Panel>
            <Panel title="Devices" className="h-1/3">
                <div className="p-2 text-xs text-text-secondary">
                    <div>Synth (Subtractive)</div>
                    <div>EQ-3</div>
                    <div>Compressor</div>
                    <div>Delay</div>
                </div>
            </Panel>
        </div>
    );
};
