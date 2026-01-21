import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { RenderLoop, RenderCallback } from '../../canvas/RenderLoop';

interface CanvasViewProps {
    onRender: RenderCallback;
    width?: number;
    height?: number;
    className?: string;
}

export interface CanvasHandle {
    start: () => void;
    stop: () => void;
}

export const CanvasView = forwardRef<CanvasHandle, CanvasViewProps>(({ onRender, className = '', width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const loopRef = useRef<RenderLoop>(new RenderLoop());
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        start: () => loopRef.current.start(),
        stop: () => loopRef.current.stop()
    }));

    useEffect(() => {
        const loop = loopRef.current;
        const canvas = canvasRef.current;
        
        if (canvas) {
            loop.attach(canvas);
            loop.addCallback(onRender);
            loop.start();
        }

        // Handle Resize Observer if dynamic
        const resizeObserver = new ResizeObserver(entries => {
             if (!canvas) return;
             for (let entry of entries) {
                 const { width, height } = entry.contentRect;
                 // Handle High DPI
                 const dpr = window.devicePixelRatio || 1;
                 canvas.width = width * dpr;
                 canvas.height = height * dpr;
                 canvas.style.width = `${width}px`;
                 canvas.style.height = `${height}px`;
                 
                 // Initial scale for context
                 const ctx = canvas.getContext('2d');
                 if (ctx) ctx.scale(dpr, dpr);
             }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            loop.stop();
            loop.detach();
            resizeObserver.disconnect();
        };
    }, [onRender]);

    return (
        <div ref={containerRef} className={`relative w-full h-full ${className}`}>
            <canvas ref={canvasRef} />
        </div>
    );
});
