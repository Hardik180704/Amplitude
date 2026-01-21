import type { Project } from '../store';

export const HitTest = {
    getClipAt: (
        project: Project, 
        x: number, 
        y: number, 
        scrollX: number, 
        zoom: number,
        trackHeight: number = 96
    ) => {
        // 1. Identify Track
        const trackIndex = Math.floor(y / trackHeight);
        const track = project.tracks[trackIndex];
        
        if (!track) return null;
        
        // 2. Identify Time
        // x = (beat * zoom) - scrollX
        // beat = (x + scrollX) / zoom
        const beatAtCursor = (x + scrollX) / zoom;
        
        // 3. Find Clip in Track
        // Need samples <-> beat conversion
        // Mock logic: assumes clip start/duration are mocking "samples ~ beats x constant"
        const samplesPerBeat = (44100 * 60) / project.tempo;

        for (const clip of track.clips) {
            const startBeat = clip.start / samplesPerBeat;
            const durationBeats = clip.duration / samplesPerBeat;
            const endBeat = startBeat + durationBeats;
            
            if (beatAtCursor >= startBeat && beatAtCursor <= endBeat) {
                return { clip, trackId: track.id };
            }
        }
        
        return null;
    }
};
