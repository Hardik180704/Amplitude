import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/TopBar';
import { Panel } from './components/ui/Panel';
import { MixerPanel } from './components/MixerPanel';
import { ArrangementView } from './components/ArrangementView';
import { EffectRack } from './components/EffectRack';
import { DJPerformanceView } from './components/DJPerformanceView';
import { ExportModal } from './components/modals/ExportModal';
import { SettingsModal } from './components/modals/SettingsModal';
import React, { useState, useEffect } from 'react';
import { WebSocketManager } from './api/WebSocketManager';
import { useProjectStore, type Effect } from './store';
import './App.css';

import { PianoRollCanvas } from './components/canvas/PianoRollCanvas';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { interactionManager } from './interactions/InteractionManager';
import { audioEngine } from './audio/AudioEngine';
import { transport } from './audio/TransportManager';

function App() {

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { addEffect, selectedTrackId, addClip, project } = useProjectStore();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const [viewState, setViewState] = useState(interactionManager.getState());

    useEffect(() => {
        const unsub = interactionManager.subscribe(setViewState);
        return () => { unsub(); };
    }, []);

    // Helper: Clip Resolution
    const selectedClipId = viewState.selection.length === 1 ? viewState.selection[0] : null;
    let selectedClip = null;
    let selectedClipTrackId = -1;

    if (selectedClipId) {
        for (const track of project.tracks) {
            const c = track.clips.find(clip => clip.id === selectedClipId);
            if (c) {
                selectedClip = c;
                selectedClipTrackId = track.id;
                break;
            }
        }
    }

    useEffect(() => {
        // Initialize WebSocket Connection
        WebSocketManager.getInstance().connect();
        
        // Initialize Audio Engine
        audioEngine.init().then(() => {
            // Initial Sync
            audioEngine.loadProject(JSON.stringify(useProjectStore.getState().project));
        });
        
        // Subscribe to Project Changes (Sync to Engine & Transport)
        // Subscribe to Project Changes (Sync to Engine & Transport)
        const unsubStore = useProjectStore.subscribe((state) => {
             // Granular updates are handled by the store actions now.
             // We only sync Tempo here as it's global and rare.
            transport.setTempo(state.project.tempo);
        });

        // Initial Tempo Sync
        transport.setTempo(useProjectStore.getState().project.tempo);
        
        return () => { unsubStore(); };
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
        
        const updatedStore = useProjectStore.getState();
        const createdTrack = updatedStore.project.tracks[updatedStore.project.tracks.length - 1];

        if (!createdTrack) return;
        
        // 2. Read and Decode Audio (Pro Import)
        try {
            const arrayBuffer = await file.arrayBuffer();
            const ctx = audioEngine.getContext();
            
            if (!ctx) {
                console.error("Audio Context not initialized");
                return;
            }
            
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            // Clip duration is in samples.
            // Engine sample rate is default 44100.
            const durationSamples = Math.floor(audioBuffer.duration * 44100);
            
            // Load into Engine (and cache buffer)
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
            
            audioEngine.loadSample(file.name, left, right, audioBuffer);
            
            // 3. Create Clip
            const newClip = {
                id: Date.now(),
                name: file.name,
                start: 0,
                duration: durationSamples,
                offset: 0,
                gain_db: 0,
                muted: false,
                type: 'audio' as const,
                asset_id: file.name
            };

            addClip(createdTrack.id, newClip);
            
            // 4. Notify Backend (Metadata only)
            WebSocketManager.getInstance().send('ImportFile', { 
                track_id: createdTrack.id, 
                file_name: file.name,
                size: file.size
            });
            
        } catch (err) {
            console.error("Error importing file:", err);
            alert("Failed to import audio file.");
        }

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
        else if (type === 'Bass') newEffect = { type: 'Bass', payload: { boost: 6.0, cutoff: 100, drive: 0, width: 1.0 }};
        else return;

        addEffect(selectedTrackId, newEffect);
        WebSocketManager.getInstance().send('AddEffect', { track_id: selectedTrackId, effect: newEffect });
    };

    const handleAddInstrument = (name: string) => {
        const store = useProjectStore.getState();
        store.addTrack(name);
        
        // Auto-create empty MIDI Clip
        const newTrack = store.project.tracks[store.project.tracks.length - 1]; // We really need addTrack to return ID or Track
        if (newTrack) {
             const newClip = {
                id: Date.now(),
                name: `${name} Clip`,
                start: 0,
                duration: 4 * (44100 * 60 / 120), // 4 beats (1 bar) * samplesPerBeat
                offset: 0,
                gain_db: 0,
                muted: false,
                type: 'midi' as const,
                notes: []
            };
            store.addClip(newTrack.id, newClip);
            
            // Auto-select the clip to show Piano Roll immediately
            interactionManager.selectClip(newClip.id);
        }
    };

    const { viewMode } = useProjectStore();

    if (viewMode === 'DJ') {
        return (
             <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-main text-text-primary">
                <div className="h-14 shrink-0 border-b border-white/5 z-50">
                     <TopBar onExportClick={() => setIsExportOpen(true)} onSettingsClick={() => setIsSettingsOpen(true)} />
                </div>
                <div className="flex-1 min-h-0 relative">
                    <DJPerformanceView />
                </div>
                
                {/* Modals still available */}
                 <ExportModal 
                    isOpen={isExportOpen} 
                    onClose={() => setIsExportOpen(false)} 
                    onExport={(settings) => {
                        console.log('Exporting...', settings);
                        setIsExportOpen(false);
                    }} 
                />
                <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                />
             </div>
        );
    }

    return (
        <>
            <AppShell 
                header={<TopBar onExportClick={() => setIsExportOpen(true)} onSettingsClick={() => setIsSettingsOpen(true)} />}
        sidebar={
                <div className="p-4 space-y-4">
                    <Panel title="Instruments">
                        <div className="flex flex-col gap-4 text-sm text-text-secondary overflow-y-auto max-h-[400px]">
                            {/* Synths Group */}
                            <div>
                                <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 px-2">Synthesizers</div>
                                <div className="space-y-1">
                                    {['Super Saw', 'Analogue Bass', 'Pluck Synth', 'Wavetable Lead'].map(inst => (
                                        <div key={inst} className="p-2 hover:bg-bg-hover rounded cursor-pointer flex items-center gap-2 group transition-colors" onClick={() => handleAddInstrument(inst)}>
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            {inst}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Keys Group */}
                            <div>
                                <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 px-2">Keys</div>
                                <div className="space-y-1">
                                    {['Grand Piano', 'Rhodes MkI', 'Lo-Fi Keys'].map(inst => (
                                        <div key={inst} className="p-2 hover:bg-bg-hover rounded cursor-pointer flex items-center gap-2 group transition-colors" onClick={() => handleAddInstrument(inst)}>
                                            <div className="w-2 h-2 rounded-full bg-amber-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            {inst}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pads Group */}
                            <div>
                                <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 px-2">Pads & FX</div>
                                <div className="space-y-1">
                                    {['Ethereal Pad', 'Dark Drone', 'Cinematic Sweeps'].map(inst => (
                                        <div key={inst} className="p-2 hover:bg-bg-hover rounded cursor-pointer flex items-center gap-2 group transition-colors" onClick={() => handleAddInstrument(inst)}>
                                            <div className="w-2 h-2 rounded-full bg-teal-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            {inst}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Drums Group */}
                            <div>
                                <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 px-2">Drums</div>
                                <div className="space-y-1">
                                    {['808 Kit', '909 Kit', 'Acoustic Kit', 'Breakbeat'].map(inst => (
                                        <div key={inst} className="p-2 hover:bg-bg-hover rounded cursor-pointer flex items-center gap-2 group transition-colors" onClick={() => handleAddInstrument(inst)}>
                                            <div className="w-2 h-2 rounded-full bg-rose-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            {inst}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer flex justify-between items-center group"
                                onClick={() => handleAddEffect('Bass')}
                            >
                                <span>Bass Enhancer</span>
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
            bottomPanel={
                selectedClip && selectedClip.type === 'midi' && selectedClipTrackId !== -1 ? (
                    <div className="h-64 border-t border-border-subtle bg-bg-main relative">
                         {/* Header / Toolbar for Editor */}
                         <div className="absolute top-0 left-0 right-0 h-6 flex items-center px-2 bg-bg-header border-b border-border-subtle z-10 text-xs text-text-secondary">
                            <span>{selectedClip.name}</span>
                         </div>
                         <div className="pt-6 h-full"> 
                            <PianoRollCanvas clipId={selectedClip.id} trackId={selectedClipTrackId} />
                         </div>
                    </div>
                ) : (
                    /* Show Virtual Keyboard if a track is selected but no clip is open */
                    selectedTrackId !== null ? (
                        <div className="h-48 border-t border-border-subtle bg-bg-main">
                            <VirtualKeyboard trackId={selectedTrackId} />
                        </div>
                    ) : (
                         <div className="h-48 border-t border-border-subtle bg-bg-main flex items-center justify-center text-text-muted text-xs">
                             Select a track to play instrument
                         </div>
                    )
                )
            }
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
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
        />
        </>
    );
}

export default App;
