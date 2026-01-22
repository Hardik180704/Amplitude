import { useProjectStore } from '../store';
import { transport } from '../audio/TransportManager';
import { WebSocketManager } from '../api/WebSocketManager';

export interface InteractionState {
    zoom: number;
    scrollX: number;
    selection: number[];
    draggingClipId?: number;
    dragOffset?: number; 
    isScrubbing: boolean;
    followPlayhead: boolean;
    showAutomation: boolean;
}

export type InteractionCallback = (state: InteractionState) => void;

export class InteractionManager {
    private zoom: number = 50; // Pixels per beat
    private scrollX: number = 0;
    private selection: Set<number> = new Set();
    
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    
    // Pro Features
    private isScrubbing: boolean = false;
    private followPlayhead: boolean = true;
    private showAutomation: boolean = false;
    private autoScrollSpeed: number = 0;
    private autoScrollRafId: number | null = null;
    private canvasOffsetLeft: number = 0; // Dynamic offset for skipping
    
    // Clip Drag State
    private isDraggingClip: boolean = false;
    private draggingClipId: number | null = null;
    private currentDragOffset: number = 0;

    private onChangeCallbacks: Set<InteractionCallback> = new Set();

    constructor() {}

    public setScrollX(x: number) {
        this.scrollX = Math.max(0, x);
        this.notify();
    }

    public setZoom(zoom: number) {
        this.zoom = Math.max(10, Math.min(500, zoom));
        this.notify();
    }

    public setFollowPlayhead(enabled: boolean) {
        this.followPlayhead = enabled;
        this.notify();
    }

    public startScrubbing(offsetLeft: number) {
        this.isScrubbing = true;
        this.canvasOffsetLeft = offsetLeft;
        this.followPlayhead = false; // Manual interaction disables follow
        this.notify();
    }
    
    public stopScrubbing() {
        this.isScrubbing = false;
        this.notify();
    }
    
    public toggleAutomation() {
        this.showAutomation = !this.showAutomation;
        this.notify();
    }

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
            dragOffset: this.currentDragOffset,
            isScrubbing: this.isScrubbing,
            followPlayhead: this.followPlayhead,
            showAutomation: this.showAutomation
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

        // 1. Zoom: Ctrl/Cmd + Wheel
        if (e.ctrlKey || e.metaKey) {
            const zoomDelta = -e.deltaY * 0.1;
            const prevZoom = this.zoom;
            this.zoom = Math.max(10, Math.min(500, this.zoom + zoomDelta));
            
            // Cursor-centered zoom logic
            // (cursorX + scrollX) / prevZoom = (cursorX + newScrollX) / newZoom
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            const worldX = (mouseX + this.scrollX) / prevZoom;
            this.scrollX = (worldX * this.zoom) - mouseX;
            this.scrollX = Math.max(0, this.scrollX);
        } 
        // 2. Scroll: Horizontal or Shift + Wheel or just Wheel
        else {
            this.followPlayhead = false; // Manual scroll disables follow
            if (e.shiftKey) {
                // assume vertical is handled elsewhere or we map it to horizontal for timeline
                this.scrollX = Math.max(0, this.scrollX + e.deltaY);
            } else {
                this.scrollX = Math.max(0, this.scrollX + e.deltaX + e.deltaY);
            }
        }
        
        this.notify();
    }

    public handleMouseDown(e: MouseEvent) {
        if (e.button === 1) { // Middle Click
            this.isDragging = true;
            this.followPlayhead = false; // Manual drag disables follow
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
        } else if (this.isScrubbing) {
            // Logic handled in updateScrubPosition to allow sharing with AutoScroll
            this.updateScrubPosition();
        }
        
        // Edge Auto-Scroll Detection (Only if dragging clip or scrubbing)
        if (this.isDraggingClip || this.isScrubbing) {
            const width = window.innerWidth;
            const edgeThreshold = 50;
            const maxSpeed = 20;
            
            if (e.clientX < edgeThreshold) {
                // Left Edge
                this.autoScrollSpeed = -maxSpeed * ((edgeThreshold - e.clientX) / edgeThreshold);
                this.startAutoScroll();
            } else if (e.clientX > width - edgeThreshold) {
                // Right Edge
                this.autoScrollSpeed = maxSpeed * ((e.clientX - (width - edgeThreshold)) / edgeThreshold);
                this.startAutoScroll();
            } else {
                this.stopAutoScroll();
            }
        }
    }
    
    private updateScrubPosition() {
        if (this.isScrubbing) {
             // Effective X = (MouseClientX - CanvasOffset) + ScrollX
             const x = Math.max(0, this.lastMouseX - this.canvasOffsetLeft);
             
             const pixel = x + this.scrollX;
             const beat = pixel / this.zoom;
             const time = beat * (60 / transport.tempo);
             
             transport.setTime(time);
        }
    }

    private startAutoScroll() {
        if (this.autoScrollRafId) return;
        
        const loop = () => {
            if (Math.abs(this.autoScrollSpeed) > 0.1) {
                this.scrollX = Math.max(0, this.scrollX + this.autoScrollSpeed);
                this.notify();
                
                // If scrubbing, existing mouse position now points to NEW time
                if (this.isScrubbing) {
                    this.updateScrubPosition();
                }
                
                this.autoScrollRafId = requestAnimationFrame(loop);
            } else {
                this.stopAutoScroll();
            }
        };
        this.autoScrollRafId = requestAnimationFrame(loop);
    }
    
    private stopAutoScroll() {
        if (this.autoScrollRafId) {
            cancelAnimationFrame(this.autoScrollRafId);
            this.autoScrollRafId = null;
        }
        this.autoScrollSpeed = 0;
    }

    public handleMouseUp() {
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
        this.stopAutoScroll(); // Stop auto-scroll on release
        this.draggingClipId = null;
        this.currentDragOffset = 0;
        this.notify();
    }
}

export const interactionManager = new InteractionManager();
