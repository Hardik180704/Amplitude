export const PlayheadRenderer = {
    render: (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        scrollX: number,
        zoom: number,
        currentBeat: number // Current playback position in beats
    ) => {
        // Calculate X position
        const x = (currentBeat * zoom) - scrollX;
        
        // Culling
        if (x < 0 || x > width) return;
        
        // Draw Line
        ctx.beginPath();
        ctx.strokeStyle = '#00afdb'; // accent-primary
        ctx.lineWidth = 1;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Draw Triangle Cap
        ctx.fillStyle = '#00afdb';
        ctx.beginPath();
        ctx.moveTo(x - 5, 0);
        ctx.lineTo(x + 5, 0);
        ctx.lineTo(x, 8);
        ctx.fill();
    }
};
