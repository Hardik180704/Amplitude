import { audioEngine } from './AudioEngine';

export class TransportManager {
    private _currentTime: number = 0; // Stopped/Paused time in seconds
    public tempo: number = 120;
    public isPlaying: boolean = false;

    private startContextTime: number = 0;
    private startTimeOffset: number = 0;
    private listeners: Set<() => void> = new Set(); 

    constructor() {}

    private isTransitioning: boolean = false;

    public get currentTime(): number {
        if (!this.isPlaying) return this._currentTime;
        const ctx = audioEngine.getContext();
        if (ctx) {
            return Math.max(0, this.startTimeOffset + (ctx.currentTime - this.startContextTime));
        }
        return this._currentTime;
    }

    public setTempo(bpm: number) {
        this.tempo = bpm;
    }

    public async play() {
        if (this.isPlaying || this.isTransitioning) return;
        
        console.log("Transport: Play starting...");
        this.isTransitioning = true;
        this.isPlaying = true; // Immediate UI feedback
        this.notify();

        try {
            // Ensure engine is ready (lazy init if needed)
            if (!audioEngine.getInitialized()) {
                await audioEngine.init();
            }
            
            await audioEngine.resume();
            
            const ctx = audioEngine.getContext();
            if (ctx) {
                this.startContextTime = ctx.currentTime;
                this.startTimeOffset = this._currentTime;
                
                audioEngine.seek(this._currentTime);
                audioEngine.setPlaying(true);
                
                console.log("Transport: Engine Sync Complete at", this._currentTime);
            }
        } catch (e) {
            console.error("Transport: Play failed", e);
            this.isPlaying = false;
        } finally {
            this.isTransitioning = false;
            this.notify();
        }
    }

    public async pause() {
        if (!this.isPlaying || this.isTransitioning) return;
        
        console.log("Transport: Pause starting...");
        this.isTransitioning = true;
        this.isPlaying = false; // Immediate UI feedback
        this.notify();

        try {
            audioEngine.setPlaying(false);
            this._currentTime = this.currentTime; // Capture exact stop time
        } finally {
            this.isTransitioning = false;
            this.notify();
        }
    }

    public async stop() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        try {
            audioEngine.setPlaying(false);
            this.isPlaying = false;
            this._currentTime = 0;
            audioEngine.seek(0);
        } finally {
            this.isTransitioning = false;
            this.notify();
        }
    }

    public async toggle() {
        if (this.isPlaying) await this.pause();
        else await this.play();
    }
    
    public setTime(seconds: number) {
        this._currentTime = Math.max(0, seconds);
        const ctx = audioEngine.getContext();
        if (ctx && this.isPlaying) {
             this.startContextTime = ctx.currentTime;
             this.startTimeOffset = this._currentTime;
        }
        this.notify();
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
