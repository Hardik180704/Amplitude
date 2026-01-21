import type { Project } from '../store';

export const initialProject: Project = {
    name: "New Project",
    tempo: 120,
    tracks: [
        {
            id: 0,
            name: "Track 1",
            gain_db: 0.0,
            pan: 0.0,
            muted: false,
            soloed: false,
            clips: [],
            effects: []
        },
        {
            id: 1,
            name: "Track 2",
            gain_db: -3.0,
            pan: 0.5,
            muted: false,
            soloed: false,
            clips: [],
            effects: []
        }
    ]
};
