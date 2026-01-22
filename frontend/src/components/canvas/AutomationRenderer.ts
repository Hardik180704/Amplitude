import { AutomationLane } from '../../store';

export class AutomationRenderer {
    static renderLane(
        ctx: CanvasRenderingContext2D,
        lane: AutomationLane,
        width: number,
        height: number,
        scrollX: number, // pixels
        zoom: number, // pixels per beat
        tempo: number,
        color: string = '#3b82f6' // Blue-500
    ) {
        if (!lane.points || lane.points.length === 0) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Convert time (seconds) to pixels
        // pixel = beat * zoom
        // beat = time / (60/tempo)
        const secondsToPx = (t: number) => {
            const beat = t * (tempo / 60);
            return (beat * zoom) - scrollX;
        };
        
        // Value to Y (0-1 -> height-0)
        // 1.0 is top (0), 0.0 is bottom (height)
        const valToY = (v: number) => {
            return height - (v * height);
        };

        const sorted = [...lane.points].sort((a, b) => a.time - b.time);

        // Move to start (or before first point)
        if (sorted[0].time > 0) {
            ctx.moveTo(secondsToPx(0), valToY(sorted[0].value));
            ctx.lineTo(secondsToPx(sorted[0].time), valToY(sorted[0].value));
        } else {
            ctx.moveTo(secondsToPx(sorted[0].time), valToY(sorted[0].value));
        }

        for (let i = 0; i < sorted.length - 1; i++) {
            // const p1 = sorted[i]; // Unused
            const p2 = sorted[i+1];
            
            // const x1 = secondsToPx(p1.time); // Unused
            // const y1 = valToY(p1.value); // Unused
            const x2 = secondsToPx(p2.time);
            const y2 = valToY(p2.value);

            // Curve Logic
            // For MVP we just do Linear. 
            // TODO: Implement Bezier visual
            // If curve is Bezier, we need control points.
            
            // let tension = 0;
            // if (typeof p1.curve === 'object' && 'Bezier' in p1.curve) {
            //    tension = p1.curve.Bezier;
            // }

            // Linear for now
            ctx.lineTo(x2, y2);
            
            // Draw Point Handle
            // ctx.fillStyle = color;
            // ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
        }

        // Draw last segment to infinity? Or just stop.
        // Usually automation holds last value.
        const last = sorted[sorted.length - 1];
        ctx.lineTo(width, valToY(last.value)); // Draw to end of screen

        ctx.stroke();

        // Render Handles on top
        ctx.fillStyle = '#ffffff';
        for (const p of sorted) {
             const x = secondsToPx(p.time);
             const y = valToY(p.value);
             // Skip if off screen
             if (x < -10 || x > width + 10) continue;
             
             ctx.beginPath();
             ctx.arc(x, y, 3, 0, Math.PI * 2);
             ctx.fill();
             ctx.stroke(); // border
        }
    }
}
