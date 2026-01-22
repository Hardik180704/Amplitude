import React, { useRef, useEffect } from 'react';

// --- Granular Cloud Visualizer ---
interface GranularCloudProps {
    density: number; // 0 to 100
    spray: number; // 0 to 1
    playing: boolean;
}

interface Particle {
    x: number;
    y: number;
    age: number;
    life: number;
    size: number;
}

export const GranularCloud: React.FC<GranularCloudProps> = ({ density, spray, playing }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        const animate = () => {
            // Spawn
            if (playing && Math.random() < (density / 100)) {
                particles.current.push({
                    x: width / 2 + (Math.random() - 0.5) * width * spray,
                    y: height / 2 + (Math.random() - 0.5) * height * spray * 0.5,
                    age: 0,
                    life: 20 + Math.random() * 40,
                    size: 1 + Math.random() * 2
                });
            }

            // Clear
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; // Trail effect
            ctx.fillRect(0, 0, width, height);
            
            // Draw
            ctx.fillStyle = '#60a5fa'; // Blue-400
            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.age++;
                if (p.age > p.life) {
                    particles.current.splice(i, 1);
                    continue;
                }
                
                const alpha = 1.0 - (p.age / p.life);
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            rafRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => cancelAnimationFrame(rafRef.current);
    }, [density, spray, playing]);

    return (
        <canvas ref={canvasRef} className="w-full h-full rounded bg-zinc-950 border border-zinc-800" />
    );
};

// --- Wavetable 3D Visualizer ---
interface Wavetable3DProps {
    morph: number; // 0 to 1 (Position in wavetable)
}

export const Wavetable3D: React.FC<Wavetable3DProps> = ({ morph }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        // Generate Frames (Sine -> Saw -> Square)
        const numFrames = 8;
        const tableSize = 64;
        const frames: number[][] = [];
        
        for(let f=0; f<numFrames; f++) {
            const row: number[] = [];
            const t = f / (numFrames - 1);
            for(let i=0; i<tableSize; i++) {
                const ph = i/tableSize;
                const sine = Math.sin(ph * Math.PI * 2);
                const saw = 1.0 - 2.0 * ph;
                const square = ph < 0.5 ? 1.0 : -1.0;
                
                 let val = 0;
                 if (t < 0.5) {
                    const blend = t * 2.0;
                    val = sine * (1.0 - blend) + saw * blend;
                 } else {
                    const blend = (t - 0.5) * 2.0;
                    val = saw * (1.0 - blend) + square * blend;
                 }
                 row.push(val);
            }
            frames.push(row);
        }

        const animate = () => {
            ctx.clearRect(0,0,width,height);
            
            // Perspective Projection
            // We draw lines stacked back to front
            
            const centerX = width / 2;
            const centerY = height / 2;
            const depthStep = 20;
            const startDepth = 0;
            
            // We highlight the frame closest to 'morph'
            const activeFrameIndex = morph * (numFrames - 1);
            
            for(let f=0; f<numFrames; f++) {
                const z = startDepth + f * depthStep;
                const scale = 1000 / (1000 + z); // Simple perspective
                
                const yOffset = -f * 15 + (numFrames * 15 * 0.5); // Stack vertically
                
                ctx.beginPath();
                ctx.strokeStyle = '#3f3f46'; // Zinc-700 default
                ctx.lineWidth = 1;
                
                // Highlight active
                const dist = Math.abs(f - activeFrameIndex);
                if (dist < 0.6) {
                    ctx.strokeStyle = '#ec4899'; // Pink-500
                    ctx.lineWidth = 2 + (1.0 - dist) * 2;
                }
                
                for(let i=0; i<tableSize; i++) {
                    const sample = frames[f][i];
                    
                    // X maps -1 to 1 based on phase
                    const ph = i / (tableSize-1); // 0 to 1
                    const xRaw = (ph - 0.5) * 200; // -100 to 100
                    const yRaw = sample * -30 + yOffset;
                    
                    const x = centerX + xRaw * scale;
                    const y = centerY + yRaw * scale;
                    
                    if (i===0) ctx.moveTo(x,y);
                    else ctx.lineTo(x,y);
                }
                ctx.stroke();
            }
            
            rafRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        return () => cancelAnimationFrame(rafRef.current);
    }, [morph]);

    return (
        <canvas ref={canvasRef} className="w-full h-full rounded bg-zinc-950 border border-zinc-800" />
    );
};
