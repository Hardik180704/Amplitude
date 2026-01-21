import { WebSocketManager } from '../api/WebSocketManager';
import { useProjectStore } from '../store';

export interface InteractionState {
    zoom: number;
    scrollX: number;
    selection: number[];
    draggingClipId?: number;
    dragOffset?: number; // In beats? or Pixels? Let's use pixels for renderer, convert to time for commit.
}

export type InteractionCallback = (state: InteractionState) => void;

export class InteractionManager {
    private zoom: number = 50; // Pixels per beat
    private scrollX: number = 0;
    private selection: Set<number> = new Set();
    
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    
    // Clip Drag State
    private isDraggingClip: boolean = false;
    private draggingClipId: number | null = null;
    private dragStartX: number = 0;
    private currentDragOffset: number = 0;

    private onChangeCallbacks: Set<InteractionCallback> = new Set();

    constructor() {}

    public selectClip(id: number, exclusive: boolean = true) {
        if (exclusive) {
            this.selection.clear();
        }
        this.selection.add(id);
        this.notify();
    }
    
    public startClipDrag(clipId: number, startX: number) {
        this.isDraggingClip = true;
        this.draggingClipId = clipId;
        this.dragStartX = startX;
        this.lastMouseX = startX;
        this.currentDragOffset = 0;
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
            selection: Array.from(this.selection),
            draggingClipId: this.draggingClipId || undefined,
            dragOffset: this.currentDragOffset
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
        const deltaX = e.clientX - this.lastMouseX;
        this.lastMouseX = e.clientX;

        if (this.isDragging) {
            this.scrollX = Math.max(0, this.scrollX - deltaX);
            this.notify();
        } else if (this.isDraggingClip && this.draggingClipId !== null) {
            this.currentDragOffset += deltaX;
            this.notify();
        }
    }

    public handleMouseUp(_e: MouseEvent) {
        if (this.isDraggingClip && this.draggingClipId !== null) {
            // Commit drag
            const store = useProjectStore.getState();
            // Find clip to get original start? 
            // We need a helper to find clip by ID.
            let clip = null;
            let trackId = -1;
            for (const t of store.project.tracks) {
                const c = t.clips.find(c => c.id === this.draggingClipId);
                if (c) {
                    clip = c;
                    trackId = t.id;
                    break;
                }
            }

            if (clip && trackId !== -1) {
                const deltaBeats = this.currentDragOffset / this.zoom;
                const newStart = Math.max(0, clip.start + deltaBeats);
                
                // Optimistic Update
                store.moveClip(clip.id, newStart, trackId);
                
                // Network update
                WebSocketManager.getInstance().send('MoveClip', { 
                    clip_id: clip.id, 
                    new_start: newStart, 
                    track_id: trackId 
                });
            }
        }

        this.isDragging = false;
        this.isDraggingClip = false;
        this.draggingClipId = null;
        this.currentDragOffset = 0;
        this.notify();
    }
}

export const interactionManager = new InteractionManager();
