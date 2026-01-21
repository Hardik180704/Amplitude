export interface InteractionState {
    zoom: number;
    scrollX: number;
    selection: number[]; // Array of selected clip IDs
}

export type InteractionCallback = (state: InteractionState) => void;

export class InteractionManager {
    private zoom: number = 50; // Pixels per beat
    private scrollX: number = 0;
    private selection: Set<number> = new Set();
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private onChangeCallbacks: Set<InteractionCallback> = new Set();

    constructor() {}

    public selectClip(id: number, exclusive: boolean = true) {
        if (exclusive) {
            this.selection.clear();
        }
        this.selection.add(id);
        this.notify();
    }
    
    public clearSelection() {
        this.selection.clear();
        this.notify();
    }
    
    public getState(): InteractionState {
        return {
            zoom: this.zoom,
            scrollX: this.scrollX,
            selection: Array.from(this.selection)
        };
    }

    public subscribe(cb: InteractionCallback) {
        this.onChangeCallbacks.add(cb);
        return () => this.onChangeCallbacks.delete(cb);
    }

    private notify() {
        const state = this.getState();
        this.onChangeCallbacks.forEach(cb => cb(state));
    }

    // --- Event Handlers ---

    public handleWheel(e: WheelEvent) {
        e.preventDefault();

        // Zoom: Ctrl/Cmd + Wheel
        if (e.ctrlKey || e.metaKey) {
            const zoomDelta = -e.deltaY * 0.1;
            const newZoom = Math.max(10, Math.min(500, this.zoom + zoomDelta));
            
            // Zoom towards mouse pointer logic (simplified for now: center or left)
            // Ideally: preserve time at mouseX
            this.zoom = newZoom;
        } 
        // Scroll: Horizontal or Shift + Wheel or just Wheel
        else {
            this.scrollX = Math.max(0, this.scrollX + e.deltaX + e.deltaY);
        }
        
        this.notify();
    }

    public handleMouseDown(e: MouseEvent) {
        if (e.button === 1) { // Middle Click
            this.isDragging = true;
            this.lastMouseX = e.clientX;
        }
    }

    public handleMouseMove(e: MouseEvent) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            this.scrollX = Math.max(0, this.scrollX - deltaX);
            this.lastMouseX = e.clientX;
            this.notify();
        }
    }

    public handleMouseUp(_e: MouseEvent) {
        this.isDragging = false;
    }
}

export const interactionManager = new InteractionManager();
