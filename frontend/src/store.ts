import { create } from 'zustand';
import { initialProject } from './utils/mockProject'; // We'll assume this exists or create it

// Types mirroring Rust Shared types
export interface ClipData {
    id: number;
    name: string;
    start: number;
    duration: number;
    offset: number;
    gain_db: number;
    muted: boolean;
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
    addTrack: () => void;
    setIsPlaying: (playing: boolean) => void;
    addClip: (trackId: number, clip: ClipData) => void;
    moveClip: (clipId: number, newStart: number, trackId: number) => void;
    addEffect: (trackId: number, effect: Effect) => void;
    removeEffect: (trackId: number, index: number) => void;
    updateEffect: (trackId: number, index: number, effect: Effect) => void;
    
    // Selection
    selectedTrackId: number | null;
    setSelectedTrack: (id: number | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    project: initialProject,
    isPlaying: false,
    
    setProject: (project) => set({ project }),
    
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    
    updateTrack: (id, updates) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
        }
    })),
    
    addTrack: () => set((state) => {
        const newId = state.project.tracks.length;
        return {
            project: {
                ...state.project,
                tracks: [...state.project.tracks, {
                    id: newId,
                    name: `Track ${newId + 1}`,
                    gain_db: 0,
                    pan: 0,
                    muted: false,
                    soloed: false,
                    clips: [],
                    effects: []
                }]
            }
        };
    }),

    addClip: (trackId, clip) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t => t.id === trackId ? {
                ...t,
                clips: [...t.clips, clip]
            } : t)
        }
    })),

    moveClip: (clipId, newStart, trackId) => set((state) => {
        return {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t => t.id === trackId ? {
                    ...t,
                    clips: t.clips.map(c => c.id === clipId ? { ...c, start: newStart } : c)
                } : t)
            }
        };
    }),

    addEffect: (trackId, effect) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t => t.id === trackId ? {
                ...t,
                effects: [...t.effects, effect]
            } : t)
        }
    })),

    removeEffect: (trackId, index) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t => t.id === trackId ? {
                ...t,
                effects: t.effects.filter((_, i) => i !== index)
            } : t)
        }
    })),

    updateEffect: (trackId, index, newEffect) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t => t.id === trackId ? {
                ...t,
                effects: t.effects.map((e, i) => i === index ? newEffect : e)
            } : t)
        }
    })),

    selectedTrackId: null,
    setSelectedTrack: (id) => set({ selectedTrackId: id })
}));
