import { AudioContextManager } from '../audio/AudioContextManager';
import { useProjectStore } from '../store';

type WebSocketMessage = 
    | { type: 'StateUpdate', payload: any }
    | { type: 'Init', payload: any }
    | { type: 'Error', message: string };

export class WebSocketManager {
    private static instance: WebSocketManager;
    private ws: WebSocket | null = null;
    private url: string = 'ws://localhost:3000/ws'; // Default local address
    private reconnectInterval: number = 3000;
    private isConnected: boolean = false;

    private constructor() {}

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    public connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`Connecting to WS at ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WS Connected');
            this.isConnected = true;
            // Optionally send an identifying handshake or "JoinRoom" message
        };

        this.ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WS Closed. Reconnecting...');
            this.isConnected = false;
            this.ws = null;
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = (err) => {
            console.error('WS Error', err);
            this.ws?.close();
        };
    }

    public send(action: string, payload: any) {
        if (!this.isConnected || !this.ws) {
            console.warn('WS not connected. Action dropped:', action);
            return;
        }
        this.ws.send(JSON.stringify({ type: action, payload }));
    }

    private handleMessage(msg: WebSocketMessage) {
        if (msg.type === 'Error') {
            console.error('Backend Error:', msg.message);
            return;
        }

        if (msg.type === 'Init') {
            console.log('Initializing Project State:', msg.payload);
            const store = useProjectStore.getState();
            if (store.setProject) {
                store.setProject(msg.payload);
            }
            return;
        }

        if (msg.type === 'StateUpdate') {
            try {
                // Parse the Action payload
                // The backend sends: { type: "ActionType", ... }
                // Sometimes wrapped in "StateUpdate" structure depending on implementation
                // Based on ws.rs, it broadcasts the raw JSON string of the Action.
                // But the frontend wrapper might wrap it. 
                // Let's assume msg.payload IS the Action object.
                
                const action = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
                console.log('WS Action:', action);
                
                // 1. Update Audio Engine
                // We pass the raw action to the AudioWorklet via AudioContextManager
                AudioContextManager.getInstance().sendCommand(action.type, action);

                // 2. Update Local Store (if not originating from self - simpler to just apply always for now)
                const store = useProjectStore.getState();
                
                switch (action.type) {
                    case 'Play':
                        store.setIsPlaying(true);
                        break;
                    case 'Stop':
                        store.setIsPlaying(false);
                        break;
                    case 'UpdateTrack':
                        // action.payload is TrackData? No, Action::UpdateTrack(TrackData)
                        // In JSON: { type: "UpdateTrack", ...properties of TrackData } if untagged?
                        // Rust Serde enum tagging: #[serde(tag = "type", content = "payload")]
                        // So it will be { type: "UpdateTrack", payload: { id: 1, vol: 0.5 ... } }
                        if (action.payload) {
                            store.updateTrack(action.payload.id, action.payload);
                        }
                        break;
                    case 'AddClip':
                        if (action.track_id !== undefined && action.clip) {
                            store.addClip(action.track_id, action.clip); 
                        }
                        break;
                    case 'AddEffect':
                        if (action.track_id !== undefined && action.effect) {
                            store.addEffect(action.track_id, action.effect);
                        }
                        break;
                    case 'RemoveEffect':
                        if (action.track_id !== undefined && action.index !== undefined) {
                            store.removeEffect(action.track_id, action.index);
                        }
                        break;
                    case 'UpdateEffect':
                        if (action.track_id !== undefined && action.index !== undefined && action.effect) {
                            store.updateEffect(action.track_id, action.index, action.effect);
                        }
                        break;
                    // ... Handle other cases
                }

            } catch(e) {
                console.error('Error handling WS action', e);
            }
        }
    }
}
