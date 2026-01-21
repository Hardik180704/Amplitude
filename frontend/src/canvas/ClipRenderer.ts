import type { Project } from '../store';

export const ClipRenderer = {
    renderTracks: (
        ctx: CanvasRenderingContext2D, 
        project: Project, 
        width: number, 
        _height: number, 
        scrollX: number, 
        zoom: number,
        selection: number[], // Array of selected IDs
        trackHeight: number = 96
    ) => {
        // Calculate visible range (Unused for now, but ready for logic)
        // const startPixel = scrollX;
        // const endPixel = scrollX + width;

        if (!project.tracks) return;

        project.tracks.forEach((track, index) => {
            const trackTop = index * trackHeight;
            // Optimization: Skip tracks off-screen (vertical culling)
            // For now, we assume few tracks, but later add scrollY logic
            
            // Draw Track Background (Alternating)
            ctx.fillStyle = index % 2 === 0 ? '#18181B' : '#151518';
            ctx.fillRect(0, trackTop, width, trackHeight);
            
            // Draw Clips
            track.clips.forEach(clip => {
                // Clip Position (Horizontal)
                // Assuming clip.start is in samples, convert to pixels via Tempo
                // Formula: samples -> beats -> pixels
                // For simplified phase 2: assume clip.start is relative unit for now or 
                // we need SampleRate and Tempo. 
                
                // Let's assume clip.start is in "Beats" for the UI store currently?
                // Checking project.rs data structure... it likely stores Sample index.
                
                // TEMPORARY PROTOTYPE LOGIC:
                // Assume 1 beat = 44100 / 2 samples (120bpm approx)
                // Just for visualization "mocking" until we unify units.
                
                // Let's rely on unit-less "position" if possible or mock it.
                // Since our store `ClipData` has `start` in Samples (u64).
                
                const samplesPerBeat = (44100 * 60) / project.tempo;
                const startBeat = clip.start / samplesPerBeat;
                const durationBeats = clip.duration / samplesPerBeat;
                
                const x = (startBeat * zoom) - scrollX;
                const w = durationBeats * zoom;
                
                // Horizontal Culling
                if (x + w < 0 || x > width) return;
                
                const isSelected = selection.includes(clip.id);
                
                // Draw Clip Rect
                renderClipRect(ctx, x, trackTop + 2, w, trackHeight - 4, clip.name, isSelected);
            });
            
            // Draw Separator
            ctx.fillStyle = '#2a2a35';
            ctx.fillRect(0, trackTop + trackHeight - 1, width, 1);
        });
    }
};

const renderClipRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    label: string,
    isSelected: boolean = false
) => {
    // Body
    ctx.fillStyle = isSelected ? '#3f3f4e' : '#272730'; // Highlight if selected
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = isSelected ? '#ffffff' : '#00afdb'; 
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, w, h);
    
    // Header Bar
    ctx.fillStyle = 'rgba(0, 175, 219, 0.2)';
    ctx.fillRect(x, y, w, 16);
    
    // Label
    ctx.fillStyle = '#E4E4E5';
    ctx.font = '10px Inter';
    ctx.fillText(label, x + 4, y + 12);
}
