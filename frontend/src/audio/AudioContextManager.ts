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
            
            // Create the Worklet Node
            // 'audio-engine-processor' must match the name in audio-processor.js registerProcessor
            this.workletNode = new AudioWorkletNode(this.context, 'audio-engine-processor', {
                outputChannelCount: [2], // Stereo
                processorOptions: {
                    // Shared buffer keys could go here
                }
            });

            this.workletNode.connect(this.context.destination);
            console.log('Audio Node connected');
        } catch (e) {
            console.error('Failed to load AudioWorklet:', e);
        }
    }
    
    suspend() {
        return this.context.suspend();
    }
    
    resume() {
        return this.context.resume();
    }
}
