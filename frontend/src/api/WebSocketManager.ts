import { useProjectStore } from '../store';
import { AudioContextManager } from '../audio/AudioContextManager';

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
        switch (msg.type) {
            case 'StateUpdate':
                // Parse the internal payload string (if it's double-serialized)
                try {
                     // If payload is a string (Wait, backend sends "Echo: JSONString")
                     // We need to match the backend protocol carefully.
                     // Current Backend: "{\"type\": \"StateUpdate\", \"payload\": \"Echo: " + text + "\"}"
                     // Actually, my backend code sends: text directly if it's an action broadcast.
                     
                     // Let's assume the backend broadcasts the raw Action JSON back.
                     // The "Echo" logic in my previous backend step was:
                     // let _ = tx.send(text); -> This sends the raw JSON string of the Action.
                     
                     const action = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
                     console.log('WS Action:', action);

                     if (action.type === 'Play') {
                         AudioContextManager.getInstance().sendCommand('Play', {});
                     } else if (action.type === 'Stop') {
                         AudioContextManager.getInstance().sendCommand('Stop', {});
                     }
                     // TODO: Handle UpdateTrack, AddClip etc.
                } catch(e) {
                    console.error('Error handling WS action', e);
                }
                break;
            case 'Error':
                console.error('Backend Error:', msg.message);
                break;
             // Handle "Init"
             case 'Init' as any: 
                console.log('Initializing Project State:', msg.payload);
                // useProjectStore.getState().setProject(msg.payload);
                break;
        }
    }
}
