import React, { useEffect, useRef, useCallback } from 'react';
import { ClipRenderer } from '../../canvas/ClipRenderer';
import { CanvasView } from './CanvasView';
import { useProjectStore } from '../../store';
import { interactionManager } from '../../interactions/InteractionManager';
import { HitTest } from '../../canvas/HitTest';
import { audioEngine } from '../../audio/AudioEngine';
import { transport } from '../../audio/TransportManager';

export const Timeline: React.FC = () => {
    // Refs for heavy state to avoid re-renders of the Canvas loop
    const projectRef = useRef(useProjectStore.getState().project);
    const viewStateRef = useRef(interactionManager.getState());
    
    // We still need some re-renders for React logic if needed, but for Canvas we use Refs.
    // Actually, we can just subscribe.
    
    useEffect(() => {
        // Subscribe to Project changes
        const unsubProject = useProjectStore.subscribe((state) => {
            projectRef.current = state.project;
        });
        
        // Subscribe to Interaction changes
        const unsubInteraction = interactionManager.subscribe((state) => {
            viewStateRef.current = state;
        });
        
        return () => {
             unsubProject();
             unsubInteraction();
        };
    }, []);

    // Theme Colors (Crimson Palette)
    const colors = {
        bg: '#09090b',        // Main Canvas Background
        gridMajor: '#27272a', // Zinc-800
        gridMinor: '#18181b', // Zinc-900
        text: '#71717a',      // Zinc-500
        textHighlight: '#a1a1aa'
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _dt: number) => {
        const project = projectRef.current;
        const viewState = viewStateRef.current;
        const { zoom, scrollX, selection, draggingClipId, dragOffset, followPlayhead } = viewState;
        
        // Clear background
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);

        const dpr = window.devicePixelRatio || 1;
        const visibleWidth = width / dpr;
        
        // Sync Playhead
        const currentBeat = transport.currentBeat;
        const playheadPx = currentBeat * zoom;

        // LOCAL scrollX so we can update it and use it in the same frame
        let activeScrollX = scrollX;

        // --- Premium Auto-Scroll Logic (Continuous) ---
        if (followPlayhead && transport.isPlaying) {
             const playheadAt = 0.2; // Keep playhead at 20% of screen
             const targetScrollX = playheadPx - (visibleWidth * playheadAt);
             
             if (targetScrollX > 0) {
                 // Update the manager for permanent state
                 interactionManager.setScrollX(targetScrollX);
                 // Use it immediately for this draw call to avoid 1-frame lag
                 activeScrollX = targetScrollX;
             }
        }

        ctx.save();
        ctx.translate(-activeScrollX, 0);

        // 1. Render Grid (Underlay for Tracks)
        const startPixel = activeScrollX;
        const endPixel = activeScrollX + visibleWidth;
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
            width + activeScrollX, 
            height, 
            activeScrollX, 
            zoom, 
            selection, 
            96, // track height
            draggingClipId,
            dragOffset
        );
        
        // 3. Render Playhead (Overlay)
        // Draw Red Line
        const px = playheadPx;
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

    }, []); // Explicitly empty deps. Relies on refs.

    return (
        <CanvasView 
            onRender={render} 
            className="w-full h-full cursor-crosshair"
            onMouseDown={(e) => {
                const project = projectRef.current;
                const viewState = viewStateRef.current;
                const { zoom, scrollX } = viewState;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const hit = HitTest.getClipAt(project, x, y, scrollX, zoom);
                if (hit && !e.shiftKey && !e.metaKey) {
                    interactionManager.selectClip(hit.clip.id, !e.shiftKey);
                    interactionManager.startClipDrag(hit.clip.id, e.clientX);
                } else {
                    // Start Scrubbing
                    interactionManager.setScrubbing(true);
                    
                    const pixel = x + scrollX;
                    const beat = pixel / zoom;
                    const time = beat * (60 / transport.tempo);
                    
                    transport.setTime(time);
                    audioEngine.seek(time);
                    
                    if (!e.shiftKey) interactionManager.clearSelection();
                }
            }}
            onMouseMove={(e) => interactionManager.handleMouseMove(e.nativeEvent)}
            onMouseUp={(e) => {
                interactionManager.setScrubbing(false);
                interactionManager.handleMouseUp(e.nativeEvent);
            }}
            onWheel={(e) => interactionManager.handleWheel(e.nativeEvent)}
        />
    );
};
