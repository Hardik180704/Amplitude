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
        trackHeight: number = 96,
        draggingClipId?: number,
        dragOffsetPx?: number
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
                
                let x = (startBeat * zoom) - scrollX;
                
                // Apply visual drag offset
                if (draggingClipId === clip.id && dragOffsetPx !== undefined) {
                     x += dragOffsetPx;
                }

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
    // 1. Clip Background (Glassy Dark)
    // Create subtle gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    if (isSelected) {
        gradient.addColorStop(0, '#e11d48'); // Crimson Top
        gradient.addColorStop(1, '#9f1239'); // Darker Crimson Bottom
    } else {
        gradient.addColorStop(0, '#27272a'); // Zinc-800
        gradient.addColorStop(1, '#18181b'); // Zinc-900
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // 2. Accent Strip (Top) - Only for unselected to give pop, Selected is fully colored
    if (!isSelected) {
        ctx.fillStyle = '#e11d48'; // Crimson Strip
        ctx.fillRect(x, y, w, 2);
    } // Selected has full glow

    // 3. Selection Border (Full)
    ctx.lineWidth = 1;
    if (isSelected) {
        ctx.strokeStyle = '#fff'; // White border for contrast
        ctx.strokeRect(x, y, w, h);
        
        // Add subtle glow
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 15;
        ctx.strokeRect(x,y,w,h);
        ctx.shadowBlur = 0;
    } else {
        // Subtle Border for unselected
        ctx.strokeStyle = '#3f3f46'; // Zinc-700
        ctx.strokeRect(x, y, w, h);
    }
    
    // 4. Label
    ctx.fillStyle = isSelected ? '#FFFFFF' : '#a1a1aa';
    ctx.font = 'bold 10px Inter';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip(); // Clip text
    ctx.fillText(label.toUpperCase(), x + 6, y + h / 2);
    ctx.restore();
}
