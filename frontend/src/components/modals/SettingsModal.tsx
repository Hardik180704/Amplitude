import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [audioDevice, setAudioDevice] = useState('Default Output');
    const [bufferSize, setBufferSize] = useState('512');
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[500px] bg-bg-panel border border-border-subtle rounded-lg shadow-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Parameters</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Audio Settings */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Audio</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary">Output Device</label>
                                <select 
                                    value={audioDevice}
                                    onChange={(e) => setAudioDevice(e.target.value)}
                                    className="w-full p-2 bg-bg-main border border-border-subtle rounded text-sm text-text-primary focus:border-accent-primary outline-none"
                                >
                                    <option value="Default Output">Default Output</option>
                                    <option value="MacBook Pro Speakers">MacBook Pro Speakers</option>
                                    <option value="External Headphones">External Headphones</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary">Buffer Size</label>
                                <select 
                                    value={bufferSize}
                                    onChange={(e) => setBufferSize(e.target.value)}
                                    className="w-full p-2 bg-bg-main border border-border-subtle rounded text-sm text-text-primary focus:border-accent-primary outline-none"
                                >
                                    <option value="128">128 samples</option>
                                    <option value="256">256 samples</option>
                                    <option value="512">512 samples</option>
                                    <option value="1024">1024 samples</option>
                                </select>
                            </div>
                        </div>

                         <div className="flex items-center gap-2 p-3 bg-bg-main rounded border border-border-subtle">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-xs text-text-primary font-mono">Status: Active (44.1kHz / 32-bit Float)</span>
                         </div>
                    </div>

                    {/* MIDI Settings */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-accent-primary uppercase tracking-wider">MIDI</h3>
                         <div className="p-4 border border-dashed border-border-subtle rounded flex flex-col items-center justify-center text-center gap-2 text-text-muted">
                            <span className="text-xs">No MIDI devices detected</span>
                            <Button size="sm" variant="ghost">Rescan</Button>
                         </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle">
                    <Button variant="primary" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-text-primary border-transparent">Close</Button>
                </div>
            </div>
        </div>
    );
};
