import init, { WasmAudioProcessor } from '../wasm/audio-engine';


class AudioEngine {
    private context: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null; // Fallback for simplicity
    private wasmProcessor: WasmAudioProcessor | null = null;
    private isInitialized: boolean = false;
    private initPromise: Promise<void> | null = null;
    private bufferSize: number = 4096;
    private sampleCache: Map<string, AudioBuffer> = new Map();
    private isBusy: boolean = false;
    private interleavedBuffer: Float32Array | null = null;

    constructor() {
    }

    public getInitialized() {
        return this.isInitialized;
    }

    public async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            console.log("AudioEngine: Initializing...");
            try {
                await init(); // Initialize WASM
                this.wasmProcessor = new WasmAudioProcessor();
                
                this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
                (window as any)._audioContext = this.context; // GC Protection
                
                // Create a ScriptProcessorNode
                this.processor = this.context.createScriptProcessor(this.bufferSize, 0, 2);
                (window as any)._audioProcessor = this.processor; // GC Protection
                
                this.processor.onaudioprocess = (e) => {
                    const frameCount = e.outputBuffer.length;
                    
                    // Lazy allocate on the audio thread if needed
                    if (!this.interleavedBuffer || this.interleavedBuffer.length !== frameCount * 2) {
                        this.interleavedBuffer = new Float32Array(frameCount * 2);
                    }

                    if (this.isBusy || !this.wasmProcessor) return;
                    
                    // ADD DIAGNOSTIC LOG (throttled)
                    if (Math.random() < 0.05) { // Increased to 5% for better visibility
                        console.log(`AudioEngine: Process loop active. Context: ${this.context?.state}. Buffer: ${frameCount} frames.`);
                    }

                    this.isBusy = true;
                    try {
                        const outputBuffer = e.outputBuffer;
                        const channelDataL = outputBuffer.getChannelData(0);
                        const channelDataR = outputBuffer.getChannelData(1);
                        
                        const buffer = this.interleavedBuffer;
                        
                        // Run WASM
                        const success = this.wasmProcessor.process(buffer);
                        if (!success && Math.random() < 0.05) {
                            console.warn("AudioEngine: WASM process() returned false");
                        }
                        
                        // De-interleave back to Web Audio
                        for (let i = 0; i < frameCount; i++) {
                            // JS NOISE TEST: Extremely quiet (0.0001) just to prove the node is ALIVE.
                            // If you hear a beep, the sine wave is finally reaching JS!
                            const noise = (Math.random() * 2 - 1) * 0.0001;
                            channelDataL[i] = buffer[i * 2] + noise;
                            channelDataR[i] = buffer[i * 2 + 1] + noise;
                        }
                    } finally {
                        this.isBusy = false;
                    }
                };
                
                this.processor.connect(this.context.destination);
                
                // Sync sample rate to WASM
                this.wasmProcessor.set_sample_rate(this.context.sampleRate);
                
                this.isInitialized = true;
                console.log(`Audio Engine Initialized. SR: ${this.context.sampleRate}. State: ${this.context.state}`);
            } catch (err) {
                console.error("Failed to init Audio Engine", err);
                this.initPromise = null; // Allow retry
            }
        })();
        
        return this.initPromise;
    }
    
    public loadProject(projectJson: string) {
        if (!this.wasmProcessor || !this.isInitialized) return;
        
        const wasBusy = this.isBusy;
        this.isBusy = true;
        try {
            console.log("AudioEngine: Loading Project JSON...");
            this.wasmProcessor.load_project(projectJson);
        } finally {
            this.isBusy = wasBusy;
        }
    }
    
    // Updated to accept AudioBuffer to store in cache
    public loadSample(assetId: string, left: Float32Array, right: Float32Array, buffer?: AudioBuffer) {
        if (buffer) {
            this.sampleCache.set(assetId, buffer);
        }

        if (!this.wasmProcessor || !this.isInitialized) return;

        const wasBusy = this.isBusy;
        this.isBusy = true;
        try {
           console.log(`AudioEngine: Loading Sample: ${assetId} (${left.length} frames)`);
           this.wasmProcessor.add_sample(assetId, left, right);
        } finally {
            this.isBusy = wasBusy;
        }
    }
    
    public getAudioBuffer(assetId: string): AudioBuffer | undefined {
        return this.sampleCache.get(assetId);
    }
    
    public getContext() {
        return this.context;
    }
    
    public async resume() {
        if (this.context?.state === 'suspended') {
            await this.context.resume();
            console.log("AudioEngine: Manually Resumed. State:", this.context.state);
        }
    }

    public async suspend() {
        if (this.context?.state === 'running') {
            await this.context.suspend();
        }
    }
    
    public seek(timeSeconds: number) {
        if (!this.wasmProcessor) return;
        
        const wasBusy = this.isBusy;
        this.isBusy = true;
        try {
             const sr = this.context?.sampleRate || 44100;
             const samples = Math.floor(timeSeconds * sr);
             this.wasmProcessor.seek_to_sample(BigInt(samples));
        } finally {
            this.isBusy = wasBusy;
        }
    }

    public setPlaying(playing: boolean) {
        if (!this.wasmProcessor) return;
        
        console.log("AudioEngine: Setting playing flag to", playing);
        const wasBusy = this.isBusy;
        this.isBusy = true;
        try {
             this.wasmProcessor.set_playing(playing);
             
             // If we are starting, ensure the context is definitely running
             if (playing && this.context?.state === 'suspended') {
                 this.context.resume();
             }
        } finally {
            this.isBusy = wasBusy;
        }
    }

    // Diagnostic Tool: Native Beep
    public debugBeep() {
        if (!this.context) {
            console.error("debugBeep: Context not initialized");
            return;
        }
        console.log("AudioEngine: Triggering Debug Beep (Native Web Audio)");
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.context.currentTime); // High pitch for visibility
        osc.start();
        osc.stop(this.context.currentTime + 0.5);
    }
}

export const audioEngine = new AudioEngine();
