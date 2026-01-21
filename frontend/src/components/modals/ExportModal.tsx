import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (settings: ExportSettings) => void;
}

export interface ExportSettings {
    format: 'wav' | 'mp3';
    quality: '16bit' | '24bit' | '32bit';
    range: 'loop' | 'all';
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
    const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
    const [quality, setQuality] = useState<'16bit' | '24bit' | '32bit'>('24bit');
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[400px] bg-bg-panel border border-border-subtle rounded-lg shadow-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Export Project</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
                </div>

                <div className="space-y-4">
                    {/* Format Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Format</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setFormat('wav')}
                                className={`flex-1 p-3 rounded border text-sm font-medium transition-colors ${format === 'wav' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-subtle bg-bg-main text-text-secondary hover:border-text-muted'}`}
                            >
                                WAV
                            </button>
                            <button 
                                onClick={() => setFormat('mp3')}
                                className={`flex-1 p-3 rounded border text-sm font-medium transition-colors ${format === 'mp3' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-subtle bg-bg-main text-text-secondary hover:border-text-muted'}`}
                            >
                                MP3
                            </button>
                        </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Quality</label>
                        <select 
                            value={quality}
                            onChange={(e) => setQuality(e.target.value as any)}
                            className="w-full p-2 bg-bg-main border border-border-subtle rounded text-sm text-text-primary focus:border-accent-primary outline-none"
                        >
                            <option value="16bit">16-bit (CD Quality)</option>
                            <option value="24bit">24-bit (Studio Standard)</option>
                            <option value="32bit">32-bit Float</option>
                        </select>
                    </div>

                     {/* Range (Mock) */}
                     <div className="space-y-2 opacity-50 cursor-not-allowed">
                        <label className="text-xs font-bold text-text-secondary uppercase">Range</label>
                        <div className="text-xs text-text-muted">Entire Project (00:00:00 - 01:20:00)</div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        onClick={() => onExport({ format, quality, range: 'all' })}
                        className="bg-accent-primary hover:bg-accent-primary/90 text-white"
                    >
                        Export Audio
                    </Button>
                </div>
            </div>
        </div>
    );
};
