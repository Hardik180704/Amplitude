import { useProjectStore } from '../store';

type WebSocketMessage = 
    | { type: 'StateUpdate', payload: any }
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
                // Directly sync store? Or dispatch specific action?
                // For now, let's just log. In real impl, we'd merging state.
                console.log('Received State Update:', msg.payload);
                // useProjectStore.getState().setProject(msg.payload); // Needs careful handling to avoid loops
                break;
            case 'Error':
                console.error('Backend Error:', msg.message);
                break;
        }
    }
}
