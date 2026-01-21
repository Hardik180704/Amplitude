import React, { useEffect, useState, useCallback } from 'react';
import { ClipRenderer } from '../../canvas/ClipRenderer';
import { CanvasView } from './CanvasView';
import { useProjectStore } from '../../store';
import { interactionManager } from '../../interactions/InteractionManager';
import { HitTest } from '../../canvas/HitTest';
import { transport } from '../../audio/TransportManager';

export const Timeline: React.FC = () => {
    const { project } = useProjectStore();
    // Removed local playheadPos ref as we use transport now
    
    // Subscribe to Interaction Manager
    const [viewState, setViewState] = useState(interactionManager.getState());

    useEffect(() => {
        const unsubscribe = interactionManager.subscribe(setViewState);
        return () => { unsubscribe(); };
    }, []);

    const { zoom, scrollX } = viewState;
    
    // Theme Colors (Crimson Palette)
    const colors = {
        bg: '#09090b',        // Main Canvas Background
        gridMajor: '#27272a', // Zinc-800
        gridMinor: '#18181b', // Zinc-900
        text: '#71717a',      // Zinc-500
        textHighlight: '#a1a1aa'
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => {
        // Clear background
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);
        
        // Sync Playhead
        const currentBeat = transport.currentBeat;
        // Loop for demo
        if (currentBeat * zoom > 2000) transport.stop(); // Or loop logic

        const dpr = window.devicePixelRatio || 1;
        
        ctx.save();
        ctx.translate(-scrollX, 0);

        // 1. Render Grid (Underlay for Tracks)
        const startPixel = scrollX;
        const endPixel = scrollX + (width / dpr);
        const pixelsPerBeat = zoom;
        const pixelsPerBar = pixelsPerBeat * 4;
        
        const startBar = Math.floor(startPixel / pixelsPerBar);
        const endBar = Math.ceil(endPixel / pixelsPerBar);
        
        ctx.lineWidth = 1;
        ctx.font = '10px JetBrains Mono'; // Explicit size
        ctx.textBaseline = 'top';

        // Draw Grid Lines FIRST (Behind clips)
        for (let bar = startBar; bar <= endBar; bar++) {
            const x = bar * pixelsPerBar;
            
            // Minor Beats
            for (let beat = 1; beat < 4; beat++) {
                const bx = x + (beat * pixelsPerBeat);
                if (bx > endPixel) break;
                
                ctx.beginPath();
                ctx.strokeStyle = colors.gridMinor;
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();
            }

            // Major Bar
            ctx.beginPath();
            ctx.strokeStyle = colors.gridMajor;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Bar Label
            ctx.fillStyle = colors.text;
            ctx.fillText(`${bar + 1}`, x + 6, 6);
        }

        // 2. Render Tracks & Clips
        ClipRenderer.renderTracks(
            ctx, 
            project, 
            width + scrollX, 
            height, 
            scrollX, 
            zoom, 
            viewState.selection, 
            96, // track height
            viewState.draggingClipId,
            viewState.dragOffset
        );
        
        // 3. Render Playhead (Overlay)
        // Draw Red Line
        const px = (transport.currentBeat * zoom);
        ctx.beginPath();
        ctx.strokeStyle = '#e11d48'; // accent-primary
        ctx.lineWidth = 1; // hairline
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
        
        // Glow effect
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Head Triangle
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(px - 5, 0);
        ctx.lineTo(px + 5, 0);
        ctx.lineTo(px, 8);
        ctx.fill();

        ctx.restore();

    }, [zoom, scrollX, project, viewState.selection]);

    return (
        <CanvasView 
            onRender={render} 
            className="w-full h-full cursor-crosshair"
            onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const hit = HitTest.getClipAt(project, x, y, scrollX, zoom);
                if (hit) {
                    interactionManager.selectClip(hit.clip.id, !e.shiftKey);
                    interactionManager.startClipDrag(hit.clip.id, e.clientX);
                } else {
                    if (!e.shiftKey) interactionManager.clearSelection();
                    interactionManager.handleMouseDown(e.nativeEvent);
                }
            }}
            onMouseMove={(e) => interactionManager.handleMouseMove(e.nativeEvent)}
            onMouseUp={(e) => interactionManager.handleMouseUp(e.nativeEvent)}
            onWheel={(e) => interactionManager.handleWheel(e.nativeEvent)}
        />
    );
};
