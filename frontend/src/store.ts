import { create } from 'zustand';
import { initialProject } from './utils/mockProject'; // We'll assume this exists or create it
import { audioEngine } from './audio/AudioEngine';

// Types mirroring Rust Shared types
export interface MidiNote {
    start: number;
    duration: number;
    note: number;
    velocity: number;
}

export type ClipType = 'audio' | 'midi';

export interface ClipData {
    id: number;
    type: ClipType;
    name: string;
    start: number;
    duration: number;
    offset: number;
    gain_db: number;
    muted: boolean;
    // Audio specific
    audioUrl?: string; // Legacy?
    asset_id?: string;
    // MIDI specific
    notes?: MidiNote[];
}

export type Effect = 
    | { type: 'Eq'; payload: { low_gain: number; mid_gain: number; high_gain: number } }
    | { type: 'Compressor'; payload: { threshold: number; ratio: number; attack: number; release: number; makeup_gain: number } }
    | { type: 'Delay'; payload: { time_ms: number; feedback: number; mix: number } }
    | { type: 'Reverb'; payload: { mix: number; decay: number } };

export interface TrackData {
    id: number;
    name: string;
    gain_db: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
    clips: ClipData[];
    effects: Effect[];
    // DJ State
    filter?: number; // -1 to 1
    eq?: { low: number; mid: number; high: number };
    crossfaderGroup?: 'A' | 'B' | 'Thru';
    playbackRate?: number;
}

export interface Project {
    name: string;
    tempo: number;
    tracks: TrackData[];
}

interface ProjectState {
    project: Project;
    isPlaying: boolean;
    setProject: (p: Project) => void;
    updateTrack: (id: number, updates: Partial<TrackData>) => void;
    addTrack: (name?: string) => void;
    setIsPlaying: (playing: boolean) => void;
    addClip: (trackId: number, clip: ClipData) => void;
    moveClip: (clipId: number, newStart: number, trackId: number) => void;
    addEffect: (trackId: number, effect: Effect) => void;
    removeEffect: (trackId: number, index: number) => void;
    updateEffect: (trackId: number, index: number, effect: Effect) => void;
    
    // MIDI Actions
    addNote: (trackId: number, clipId: number, note: MidiNote) => void;
    removeNote: (trackId: number, clipId: number, noteStart: number, notePitch: number) => void;
    updateNote: (trackId: number, clipId: number, oldStart: number, oldPitch: number, newNote: MidiNote) => void;
    
    // Selection
    selectedTrackId: number | null;
    setSelectedTrack: (id: number | null) => void;
    
    // Global DJ State
    crossfaderPosition: number; // -1 to 1
    viewMode: 'DAW' | 'DJ';
    setCrossfaderPosition: (pos: number) => void;
    setTrackCrossfaderGroup: (trackId: number, group: 'A' | 'B' | 'Thru') => void;
    setViewMode: (mode: 'DAW' | 'DJ') => void;

    // Performance
    setTrackFxStutter: (trackId: number, enabled: boolean) => void;
    setTrackFxTapeStop: (trackId: number, enabled: boolean) => void;
    setTrackLoop: (trackId: number, enabled: boolean, lengthBeats?: number) => void;
}
    
export const useProjectStore = create<ProjectState>((set) => ({
    project: initialProject,
    isPlaying: false,
    crossfaderPosition: 0,
    viewMode: 'DAW',
    
    setProject: (project) => set({ project }),
    setViewMode: (mode) => set({ viewMode: mode }),
    
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    
    updateTrack: (id, updates) => {
        // Granular Audio Engine Updates
        if (updates.gain_db !== undefined) audioEngine.setTrackGain(id, updates.gain_db);
        if (updates.pan !== undefined) audioEngine.setTrackPan(id, updates.pan);
        if (updates.filter !== undefined) audioEngine.setTrackFilter(id, updates.filter);
        if (updates.eq !== undefined) {
             const { low, mid, high } = updates.eq;
             audioEngine.setTrackEq(id, low, mid, high);
        }
        if (updates.playbackRate !== undefined) audioEngine.setTrackPlaybackRate(id, updates.playbackRate);
        
        set((state) => ({
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
            }
        }));
    },
    
    addTrack: (name) => set((state) => {
        const newId = state.project.tracks.length;
        const nextState = {
            project: {
                ...state.project,
                tracks: [...state.project.tracks, {
                    id: newId,
                    name: name || `Track ${newId + 1}`,
                    gain_db: 0,
                    pan: 0,
                    muted: false,
                    soloed: false,
                    clips: [],
                    effects: [],
                    filter: 0,
                    eq: { low: 1, mid: 1, high: 1 }
                }]
            }
        };
        audioEngine.loadProject(JSON.stringify(nextState.project));
        return nextState;
    }),

    addClip: (trackId, clip) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: [...t.clips, clip]
                } : t)
            }
        };
        audioEngine.loadProject(JSON.stringify(nextState.project));
        return nextState;
    }),

    moveClip: (clipId, newStart, trackId) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: t.clips.map(c => c.id === clipId ? { ...c, start: newStart } : c)
                } : t)
            }
        };
        audioEngine.loadProject(JSON.stringify(nextState.project));
        return nextState;
    }),

    addEffect: (trackId, effect) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    effects: [...t.effects, effect]
                } : t)
            }
        };
        // Update Engine (requires sending FULL effect list for that track)
        const track = nextState.project.tracks.find(t => t.id === trackId);
        if (track) audioEngine.updateTrackEffects(trackId, track.effects);
        
        return nextState;
    }),

    removeEffect: (trackId, index) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    effects: t.effects.filter((_, i) => i !== index)
                } : t)
            }
        };
        const track = nextState.project.tracks.find(t => t.id === trackId);
        if (track) audioEngine.updateTrackEffects(trackId, track.effects);
        
        return nextState;
    }),

    updateEffect: (trackId, index, newEffect) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    effects: t.effects.map((e, i) => i === index ? newEffect : e)
                } : t)
            }
        };
        const track = nextState.project.tracks.find(t => t.id === trackId);
        if (track) audioEngine.updateTrackEffects(trackId, track.effects);
        
        return nextState;
    }),

    addNote: (trackId, clipId, note) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: t.clips.map(c => c.id === clipId ? {
                        ...c,
                        notes: [...(c.notes || []), note]
                    } : c)
                } : t)
            }
        };
        // Ideally granular, but reload is safe for now
        audioEngine.loadProject(JSON.stringify(nextState.project)); 
        return nextState;
    }),

    removeNote: (trackId, clipId, noteStart, notePitch) => set((state) => {
         const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: t.clips.map(c => c.id === clipId ? {
                        ...c,
                        notes: (c.notes || []).filter(n => !(n.start === noteStart && n.note === notePitch))
                    } : c)
                } : t)
            }
        };
        audioEngine.loadProject(JSON.stringify(nextState.project));
        return nextState;
    }),

    updateNote: (trackId, clipId, oldStart, oldPitch, newNote) => set((state) => {
        const nextState = {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: t.clips.map(c => c.id === clipId ? {
                        ...c,
                        notes: (c.notes || []).map(n => 
                            (n.start === oldStart && n.note === oldPitch) ? newNote : n
                        )
                    } : c)
                } : t)
            }
        };
        audioEngine.loadProject(JSON.stringify(nextState.project));
        return nextState;
    }),

    selectedTrackId: null,
    setSelectedTrack: (id) => set({ selectedTrackId: id }),
    
    setCrossfaderPosition: (pos) => {
        audioEngine.setCrossfaderPosition(pos);
        set({ crossfaderPosition: pos });
    },
    
    setTrackCrossfaderGroup: (trackId, group) => {
        audioEngine.setTrackCrossfaderGroup(trackId, group);
        set((state) => ({
             project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? { ...t, crossfaderGroup: group } : t)
            }
        }));
    },
    
    setTrackFxStutter: (trackId, enabled) => {
        audioEngine.setTrackFxStutter(trackId, enabled);
    },
    
    setTrackFxTapeStop: (trackId, enabled) => {
        audioEngine.setTrackFxTapeStop(trackId, enabled);
    },
    
    setTrackLoop: (trackId, enabled, lengthBeats = 4) => {
        set((state) => {
            if (enabled) {
                // Cast to any to access bpm if missing from type definition
                const bpm = (state.project as any).bpm || 120;
                const secondsPerBeat = 60 / bpm;
                const loopSeconds = lengthBeats * secondsPerBeat;
                audioEngine.startTrackLoopSeconds(trackId, loopSeconds);
            } else {
                 audioEngine.startTrackLoopSeconds(trackId, 0);
            }
            return {};
        });
    }
}));
