import type { Project } from '../store';
import { audioEngine } from '../audio/AudioEngine';
import { AutomationRenderer } from '../components/canvas/AutomationRenderer';

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
        dragOffsetPx?: number,
        showAutomation: boolean = false
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
                
                const sampleRate = audioEngine.getContext()?.sampleRate || 44100;
                const samplesPerBeat = (sampleRate * 60) / project.tempo;
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
                renderClipRect(ctx, x, trackTop + 2, w, trackHeight - 4, clip.name, isSelected, clip.type === 'audio' ? clip.asset_id : undefined);
            });
            
            // Draw Separator
            ctx.fillStyle = '#2a2a35';
            ctx.fillRect(0, trackTop + trackHeight - 1, width, 1);

            // AUTO: Render Automation Lanes
            if (showAutomation && track.automation) {
                // We define specific colors for targets
                const autoColor = (target: string) => {
                    if (target.includes('gain')) return '#4ade80'; // green
                    if (target.includes('pan')) return '#facc15'; // yellow
                    return '#3b82f6'; // blue
                };

                // Move context to track top
                ctx.save();
                ctx.translate(0, trackTop);
                
                track.automation.forEach(lane => {
                    AutomationRenderer.renderLane(
                        ctx,
                        lane,
                        width,
                        trackHeight,
                        scrollX,
                        zoom,
                        project.tempo,
                        autoColor(lane.target)
                    );
                });
                
                ctx.restore();
            }
        });
    }
};

// Helper to draw waveform
const renderWaveform = (
    ctx: CanvasRenderingContext2D,
    buffer: AudioBuffer,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
) => {
    const data = buffer.getChannelData(0); // Use Left channel for mono view
    const step = Math.ceil(data.length / w);
    const amp = h / 2;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Fixed boost for visibility (typical in DAWs for non-destructive visual)
    const boost = 1.5;

    for (let i = 0; i < w; i++) {
        let min = 1.0;
        let max = -1.0;
        
        // Downsample
        const startIndex = i * step;
        if (startIndex >= data.length) break;
        
        for (let j = 0; j < step; j++) {
            const datum = data[startIndex + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        // Draw vertical line from min to max with boost
        const vMin = Math.max(-1, min * boost);
        const vMax = Math.min(1, max * boost);
        
        ctx.moveTo(x + i, y + amp + (vMin * amp));
        ctx.lineTo(x + i, y + amp + (vMax * amp));
    }
    ctx.stroke();
}

const renderClipRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    label: string,
    isSelected: boolean = false,
    assetId?: string
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
    
    // WAVEFORM RENDERING
    if (assetId) {
        const buffer = audioEngine.getAudioBuffer(assetId);
        if (buffer) {
             const waveColor = isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.4)'; 
             renderWaveform(ctx, buffer, x, y, w, h, waveColor);
        } else {
             ctx.fillStyle = '#ef4444'; // Red-500
             ctx.font = 'bold 9px monospace';
             ctx.fillText('• LOADING AUDIO...', x + 6, y + h - 10);
        }
    }
    
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
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(label.toUpperCase(), x + 6, y + h / 2);
    ctx.restore();
}
