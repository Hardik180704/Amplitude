export type RenderCallback = (ctx: CanvasRenderingContext2D, width: number, height: number, deltaTime: number) => void;

export class RenderLoop {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;
    private callbacks: RenderCallback[] = [];
    private lastFrameTime: number = 0;

    constructor() {}

    attach(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency if background is opaque
    }

    detach() {
        this.stop();
        this.canvas = null;
        this.ctx = null;
    }

    addCallback(cb: RenderCallback) {
        this.callbacks.push(cb);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private loop = () => {
        if (!this.isRunning || !this.ctx || !this.canvas) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear Screen
        this.ctx.fillStyle = '#121214'; // bg-bg-main
        this.ctx.fillRect(0, 0, width, height);

        // Run Callbacks
        for (const cb of this.callbacks) {
            this.ctx.save();
            cb(this.ctx, width, height, deltaTime);
            this.ctx.restore();
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    };
}
