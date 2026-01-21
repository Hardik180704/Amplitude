export class AudioContextManager {
    static instance: AudioContextManager;
    context: AudioContext;
    workletNode: AudioWorkletNode | null = null;

    private constructor() {
        this.context = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 44100,
        });
    }

    static getInstance(): AudioContextManager {
        if (!AudioContextManager.instance) {
            AudioContextManager.instance = new AudioContextManager();
        }
        return AudioContextManager.instance;
    }

    async initialize() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }

        try {
            await this.context.audioWorklet.addModule('/audio-processor.js');
            console.log('AudioWorklet module loaded');
            
            this.workletNode = new AudioWorkletNode(this.context, 'audio-engine-processor', {
                outputChannelCount: [2], 
            });

            this.workletNode.connect(this.context.destination);
            
            // Set up port for basic text messages (Phase 1 legacy) or binary commands
            // For now, let's just log
            this.workletNode.port.onmessage = (e) => {
                console.log("From WASM:", e.data);
            };
            
        } catch (e) {
            console.error('Failed to load AudioWorklet:', e);
        }
    }
    
    // Send a command to the audio thread
    // In strict architecture, we write to SharedArrayBuffer.
    // For Phase 2 rapid prototyping, we can use port.postMessage 
    // BUT our requirement said Lock-Free RingBuffer.
    // We already have SharedRingBuffer in Rust. 
    // We need to map SharedArrayBuffer here.
    
    // Let's implement postMessage for now to satisfy "connecting" 
    // and assume the Engine reads port messages and pushes to ring buffer internally 
    // (if we bridge in JS glue) or we implement the RingBuffer writer in JS here.
    
    // Let's do a simple postMessage bridge for Commit 7 to verify flow.
    sendCommand(type: string, payload: any) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type, payload });
        }
    }
    
    suspend() {
        return this.context.suspend();
    }
    
    resume() {
        return this.context.resume();
    }
}
