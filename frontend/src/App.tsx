import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/TopBar';
import { Panel } from './components/ui/Panel';
import { MixerPanel } from './components/MixerPanel';
import { ArrangementView } from './components/ArrangementView';
import { EffectRack } from './components/EffectRack';
import { ExportModal } from './components/modals/ExportModal';
import React, { useState, useEffect } from 'react';
import { WebSocketManager } from './api/WebSocketManager';
import { useProjectStore, type Effect } from './store';
import './App.css';

function App() {

    const [isExportOpen, setIsExportOpen] = useState(false);
    const { addEffect, selectedTrackId, addClip } = useProjectStore();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initialize WebSocket Connection
        WebSocketManager.getInstance().connect();
    }, []);


    const handleImportAudio = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Create New Track
        const store = useProjectStore.getState();
        store.addTrack(); 
        
        // Sync is tricky with zustand in event handler. Let's assume sync for now or use the updated state.
        
        // Actually, let's use the 'addTrack' from hook, but we need the ID. 
        // The simple mock store implementation of addTrack doesn't return ID. 
        // We'll read the store again after adding.
        const updatedStore = useProjectStore.getState();
        const createdTrack = updatedStore.project.tracks[updatedStore.project.tracks.length - 1];

        if (!createdTrack) return;

        // 2. Decode Audio (to get duration)
        // For now, mock duration to ensure "Real Time" responsiveness if decoding is slow
        // or just fire it.
        const duration = 10; // Default 10s if decoding fails or just mock
        
        // 3. Create Clip
        const newClip = {
            id: Date.now(),
            name: file.name,
            start: 0,
            duration: duration, // We should try to decode real duration if possible
            offset: 0,
            gain_db: 0,
            muted: false
        };

        addClip(createdTrack.id, newClip);
        
        // 4. Notify Backend
        WebSocketManager.getInstance().send('ImportFile', { 
            track_id: createdTrack.id, 
            file_name: file.name,
            size: file.size
        });

        // Reset input
        e.target.value = '';
    };

    const handleAddEffect = (type: Effect['type']) => {
        if (selectedTrackId === null) {
            alert("Please select a track first!");
            return;
        }

        let newEffect: Effect;
        if (type === 'Eq') newEffect = { type: 'Eq', payload: { low_gain: 0, mid_gain: 0, high_gain: 0 }};
        else if (type === 'Compressor') newEffect = { type: 'Compressor', payload: { threshold: -20, ratio: 4, attack: 10, release: 100, makeup_gain: 0 }};
        else if (type === 'Delay') newEffect = { type: 'Delay', payload: { time_ms: 300, feedback: 0.4, mix: 0.5 }};
        else if (type === 'Reverb') newEffect = { type: 'Reverb', payload: { mix: 0.5, decay: 2.0 }};
        else return;

        addEffect(selectedTrackId, newEffect);
        WebSocketManager.getInstance().send('AddEffect', { track_id: selectedTrackId, effect: newEffect });
    };

    return (
        <>
            <AppShell 
                header={<TopBar onExportClick={() => setIsExportOpen(true)} />}
        sidebar={
                <div className="p-4 space-y-4">
                    <Panel title="Instruments">
                        <div className="space-y-2 text-sm text-text-secondary">
                             {/* Placeholder logic for now - user asked about instruments too */}
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer" onClick={() => console.log("Add Keyboard")}>Keyboards</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Drums</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Guitars</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Bass</div>
                        </div>
                    </Panel>
                    <Panel title="Effects">
                         <div className="space-y-2 text-sm text-text-secondary">
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer flex justify-between items-center group"
                                onClick={() => handleAddEffect('Eq')}
                            >
                                <span>EQ</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 bg-bg-header p-1 rounded">+</span>
                            </div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer flex justify-between items-center group"
                                onClick={() => handleAddEffect('Compressor')}
                            >
                                <span>Compressor</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 bg-bg-header p-1 rounded">+</span>
                            </div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer flex justify-between items-center group"
                                onClick={() => handleAddEffect('Delay')}
                            >
                                <span>Delay</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 bg-bg-header p-1 rounded">+</span>
                            </div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer flex justify-between items-center group"
                                onClick={() => handleAddEffect('Reverb')}
                            >
                                <span>Reverb</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 bg-bg-header p-1 rounded">+</span>
                            </div>
                        </div>
                    </Panel>
                    <Panel title="Resources">
                        <div className="p-2">

                            <button onClick={handleImportAudio} className="w-full py-2 px-3 flex items-center justify-center gap-2 bg-bg-main border border-border-subtle rounded hover:border-accent-primary/50 text-sm text-text-primary transition-colors dashed-border">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Import Audio
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="audio/*" 
                                onChange={onFileChange} 
                            />
                            <div className="mt-2 text-[10px] text-text-muted text-center">
                                or drop files here
                            </div>
                        </div>
                    </Panel>
                </div>
            }
            main={
               <ArrangementView />
            }
            rightPanel={
                <div className="flex flex-col h-full">
                    {/* Mixer Panel always visible for now */}
                    <div className="flex-1 overflow-y-auto min-h-[50%] border-b border-border-subtle">
                        <MixerPanel />
                    </div>
                    {/* Effect Rack visible if track selected */}
                    {selectedTrackId !== null && (
                         <div className="flex-1 overflow-y-auto">
                            <EffectRack trackId={selectedTrackId} /> 
                         </div>
                    )}
                     {selectedTrackId === null && (
                        <div className="flex-1 flex items-center justify-center text-text-muted text-xs p-4 text-center">
                            Select a track to view effects
                        </div>
                    )}
                </div>
            }
            bottomPanel={null}
        />
        <ExportModal 
            isOpen={isExportOpen} 
            onClose={() => setIsExportOpen(false)} 
            onExport={(settings) => {
                console.log('Exporting with settings:', settings);
                setIsExportOpen(false);
                // TODO: Send to Backend
            }} 
        />
        </>
    );
}

export default App;
