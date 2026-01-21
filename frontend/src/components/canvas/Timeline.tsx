import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ClipRenderer } from '../../canvas/ClipRenderer';
import { PlayheadRenderer } from '../../canvas/PlayheadRenderer';
import { CanvasView } from './CanvasView';
import { useProjectStore } from '../../store';
import { interactionManager } from '../../interactions/InteractionManager';
import { HitTest } from '../../canvas/HitTest';

export const Timeline: React.FC = () => {
    const { project } = useProjectStore();
    const playheadPos = useRef(0);
    
    // Subscribe to Interaction Manager
    const [viewState, setViewState] = useState(interactionManager.getState());

    useEffect(() => {
        const unsubscribe = interactionManager.subscribe(setViewState);
        return () => { unsubscribe(); };
    }, []);

    const { zoom, scrollX } = viewState;
    
    // Theme Colors
    const colors = {
        gridMajor: 'rgba(63, 63, 78, 0.3)',
        gridMinor: 'rgba(42, 42, 53, 0.2)',
        text: '#52525B'
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => {
        // Clear background
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, width, height);
        
        // Animate Playhead (Mock)
        playheadPos.current += dt * (project.tempo / 60); 
        if (playheadPos.current * zoom > 2000) playheadPos.current = 0;

        const dpr = window.devicePixelRatio || 1;
        
        ctx.save();
        ctx.translate(-scrollX, 0);

        // 1. Render Tracks & Clips (Underlay)
        ClipRenderer.renderTracks(ctx, project, width + scrollX, height, scrollX, zoom, viewState.selection);
        
        // 2. Render Grid (Overlay)
        const startPixel = scrollX;
        const endPixel = scrollX + (width / dpr);
        const pixelsPerBeat = zoom;
        const pixelsPerBar = pixelsPerBeat * 4;
        
        const startBar = Math.floor(startPixel / pixelsPerBar);
        const endBar = Math.ceil(endPixel / pixelsPerBar);
        
        ctx.lineWidth = 1;
        ctx.font = 'JetBrains Mono'; // Simplified font string
        // ctx.textBaseline = 'top'; // Default is alphabetic, but top is fine if supported

        for (let bar = startBar; bar <= endBar; bar++) {
            const x = bar * pixelsPerBar;
            
            // Major
            ctx.beginPath();
            ctx.strokeStyle = colors.gridMajor;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            ctx.fillStyle = colors.text;
            ctx.fillText(`${bar + 1}.1`, x + 4, 12); // Adjusted y

            // Minor
            for (let beat = 1; beat < 4; beat++) {
                const bx = x + (beat * pixelsPerBeat);
                if (bx > endPixel) break;
                
                ctx.beginPath();
                ctx.strokeStyle = colors.gridMinor;
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();
            }
        }
        
        // 3. Render Playhead
        PlayheadRenderer.render(ctx, width + scrollX, height, scrollX, zoom, playheadPos.current);
        
        ctx.restore();

    }, [zoom, scrollX, project.tempo, viewState.selection]);

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
                    // interactionManager.startDrag(hit.clip.id, e.clientX); // TODO
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
