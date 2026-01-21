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

export interface TrackData {
    id: number;
    name: string;
    gain_db: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
    clips: ClipData[];
    effects: any[];
}

export interface Project {
    name: string;
    tempo: number;
    tracks: TrackData[];
}

interface ProjectState {
    project: Project;
    setProject: (p: Project) => void;
    updateTrack: (id: number, updates: Partial<TrackData>) => void;
    addTrack: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    project: initialProject,
    setProject: (project) => set({ project }),
    
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
    })
}));
