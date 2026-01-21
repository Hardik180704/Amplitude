import { ClipRenderer } from '../../canvas/ClipRenderer';

export const Timeline: React.FC<TimelineProps> = ({ zoom = 50, scrollX = 0 }) => {
    const { project } = useProjectStore();
    
    // Theme Colors
    const colors = {
        bg: '#121214',
        gridMajor: 'rgba(63, 63, 78, 0.3)', // Translucent
        gridMinor: 'rgba(42, 42, 53, 0.2)',
        text: '#52525B'
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _dt: number) => {
        // Clear background
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, width, height);

        const dpr = window.devicePixelRatio || 1;
        
        ctx.save();
        ctx.translate(-scrollX, 0);

        // 1. Render Tracks & Clips (Underlay)
        // Note: project tracks should be rendered here.
        ClipRenderer.renderTracks(ctx, project, width + scrollX, height, scrollX, zoom);
        
        // 2. Render Grid (Overlay)
        // 1. Calculate visible range
        const startPixel = scrollX;
        const endPixel = scrollX + (width / dpr); // Logical pixels
        
        // 2. Iterate beats
        // Bar = 4 beats (4/4 time)
        const pixelsPerBeat = zoom;
        const pixelsPerBar = pixelsPerBeat * 4;
        
        const startBar = Math.floor(startPixel / pixelsPerBar);
        const endBar = Math.ceil(endPixel / pixelsPerBar);
        
        ctx.lineWidth = 1;
        ctx.font = '10px JetBrains Mono';
        ctx.textBaseline = 'top';

        for (let bar = startBar; bar <= endBar; bar++) {
            const x = bar * pixelsPerBar;
            
            // Draw Bar Line (Major)
            ctx.beginPath();
            ctx.strokeStyle = colors.gridMajor;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Draw Bar Label (1.1, 2.1, etc)
            ctx.fillStyle = colors.text;
            ctx.fillText(`${bar + 1}.1`, x + 4, 2);

            // Draw Beats (Minor)
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
        
        ctx.restore();

    }, [zoom, scrollX, project.tempo]);

    return (
        <CanvasView 
            onRender={render} 
            className="w-full h-full cursor-crosshair"
        />
    );
};
