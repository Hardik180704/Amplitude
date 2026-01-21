
export class TransportManager {
    public currentTime: number = 0; // In Seconds
    public tempo: number = 120;
    public isPlaying: boolean = false;

    private lastFrameTime: number = 0;
    private rafId: number | null = null;
    private listeners: Set<() => void> = new Set(); // For state changes (Play/Stop), not time!

    constructor() {}

    public setTempo(bpm: number) {
        this.tempo = bpm;
    }

    public play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.tick();
        this.notify();
    }

    public pause() {
        this.isPlaying = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.notify();
    }

    public stop() {
        this.pause();
        this.currentTime = 0;
        this.notify();
    }

    public toggle() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    private tick = () => {
        if (!this.isPlaying) return;
        
        const now = performance.now();
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.currentTime += dt;

        this.rafId = requestAnimationFrame(this.tick);
    }

    // --- Getters ---

    public get currentBeat(): number {
        return this.currentTime * (this.tempo / 60);
    }

    public getFormattedTime(): string {
        const totalMs = Math.floor(this.currentTime * 1000);
        const min = Math.floor(totalMs / 60000);
        const sec = Math.floor((totalMs % 60000) / 1000);
        const ms = Math.floor((totalMs % 1000) / 10); // Hundredths

        return `${this.pad(min)}:${this.pad(sec)}:${this.pad(ms)}`;
    }

    private pad(n: number): string {
        return n < 10 ? '0' + n : n.toString();
    }

    // --- Subscriptions (State Only) ---
    public subscribe(cb: () => void) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    private notify() {
        this.listeners.forEach(cb => cb());
    }
}

export const transport = new TransportManager();
