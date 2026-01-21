import React, { useCallback, useState, useEffect, useRef } from 'react';
import { CanvasView } from './CanvasView';
import { useProjectStore } from '../../store';
import { interactionManager } from '../../interactions/InteractionManager';
import { transport } from '../../audio/TransportManager';
import { audioEngine } from '../../audio/AudioEngine';

interface PianoRollCanvasProps {
    clipId: number;
    trackId: number;
}

export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({ clipId, trackId }) => {
    const projectRef = useRef(useProjectStore.getState().project);
    const viewStateRef = useRef(interactionManager.getState());
    const scrollYRef = useRef(60 * 12);
    
    useEffect(() => {
        const unsubProject = useProjectStore.subscribe((state) => {
            projectRef.current = state.project;
        });
        const unsubInteraction = interactionManager.subscribe((state) => {
            viewStateRef.current = state;
        });
        return () => { 
            unsubProject(); 
            unsubInteraction();
        };
    }, []);

    // Configuration
    const NOTE_HEIGHT = 16;
    const NUM_KEYS = 127;

    // Interaction State
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize' | 'create',
        note?: { start: number, note: number, duration: number }, // Original State
        currentNote?: { start: number, note: number, duration: number }, // Visual State
        startX: number,
        startY: number,
    } | null>(null);

    const getMouseInfo = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const { scrollX, zoom } = viewStateRef.current;
        const x = e.clientX - rect.left + scrollX;
        const y = e.clientY - rect.top + scrollYRef.current;
        
        const noteIndex = Math.floor((NUM_KEYS * NOTE_HEIGHT - y) / NOTE_HEIGHT);
        const beat = x / zoom;
        const sampleRate = audioEngine.getContext()?.sampleRate || 44100;
        const samplesPerBeat = (sampleRate * 60) / projectRef.current.tempo;
        
        return { x, y, noteIndex, beat, samplesPerBeat };
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _dt: number) => {
        const project = projectRef.current;
        const viewState = viewStateRef.current;
        const { zoom, scrollX } = viewState;
        const sY = scrollYRef.current;

        // 1. Clear
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);

        const track = project.tracks.find(t => t.id === trackId);
        const clip = track?.clips.find(c => c.id === clipId);

        if (!clip || clip.type !== 'midi') {
             ctx.fillStyle = '#444';
             ctx.fillText("No MIDI Clip Selected", 20, 20);
             return;
        }

        const notes = clip.notes || [];
        const dpr = window.devicePixelRatio || 1;
        const visibleHeight = height / dpr;

        ctx.save();
        ctx.translate(0, -sY);
        ctx.translate(-scrollX, 0);

        // Grid
         for (let i=0; i < NUM_KEYS; i++) {
              const y = (NUM_KEYS - 1 - i) * NOTE_HEIGHT;
              const isBlackKey = [1, 3, 6, 8, 10].includes(i % 12);
              ctx.fillStyle = isBlackKey ? '#18181b' : '#27272a';
              ctx.fillRect(scrollX, y, width / dpr + scrollX, NOTE_HEIGHT - 1);
              ctx.fillStyle = '#3f3f46';
              ctx.fillRect(scrollX, y + NOTE_HEIGHT - 1, width / dpr + scrollX, 1);
         }
        
        const sampleRate = audioEngine.getContext()?.sampleRate || 44100;
        const samplesPerBeat = (sampleRate * 60) / project.tempo;

        const drawNote = (start: number, duration: number, pitch: number, isGhost: boolean = false) => {
             const startBeat = start / samplesPerBeat;
             const durationBeats = duration / samplesPerBeat;
             const x = startBeat * zoom;
             const w = Math.max(2, durationBeats * zoom);
             const y = (NUM_KEYS - 1 - pitch) * NOTE_HEIGHT;
             
             ctx.fillStyle = isGhost ? 'rgba(225, 29, 72, 0.4)' : '#e11d48';
             ctx.fillRect(x, y, w, NOTE_HEIGHT - 2);
             ctx.strokeStyle = '#fff';
             ctx.strokeRect(x, y, w, NOTE_HEIGHT - 2);
        };

        // Draw Notes
        notes.forEach(note => {
             if (dragState && dragState.note && 
                 note.start === dragState.note.start && 
                 note.note === dragState.note.note) return;
                 
             drawNote(note.start, note.duration, note.note);
        });

        // Draw Ghost note
        if (dragState && dragState.currentNote) {
            drawNote(dragState.currentNote.start, dragState.currentNote.duration, dragState.currentNote.note, true);
        }

        // Playhead
        const playheadPx = transport.currentBeat * zoom;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playheadPx, sY);
        ctx.lineTo(playheadPx, sY + visibleHeight);
        ctx.stroke();

        ctx.restore();

        // Piano Keys Overlay
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, 40, visibleHeight);

    }, [trackId, clipId, dragState]);

    return (
        <CanvasView 
            onRender={render}
            className="w-full h-full cursor-pointer"
            onWheel={(e) => {
                if (e.shiftKey) {
                    interactionManager.handleWheel(e.nativeEvent);
                } else {
                    const newSY = Math.max(0, Math.min(scrollYRef.current + e.deltaY, NUM_KEYS * NOTE_HEIGHT - 300));
                    scrollYRef.current = newSY;
                }
            }}
            onMouseDown={(e) => {
                 const { noteIndex, beat, samplesPerBeat } = getMouseInfo(e);
                 const startSample = beat * samplesPerBeat;
                 
                 const project = projectRef.current;
                 const track = project.tracks.find(t => t.id === trackId);
                 const clip = track?.clips.find(c => c.id === clipId);
                 if (!clip || !clip.notes) return;

                 const hitNote = clip.notes.find(n => 
                     n.note === noteIndex && 
                     startSample >= n.start && 
                     startSample < n.start + n.duration
                 );

                 if (hitNote) {
                     const noteRightBeat = (hitNote.start + hitNote.duration) / samplesPerBeat;
                     const isEdge = Math.abs(beat - noteRightBeat) < 0.2;

                     setDragState({
                         type: isEdge ? 'resize' : 'move',
                         note: { ...hitNote },
                         currentNote: { ...hitNote },
                         startX: e.clientX,
                         startY: e.clientY
                     });
                 } else {
                     const quantizedBeat = Math.floor(beat * 4) / 4;
                     const newStart = quantizedBeat * samplesPerBeat;
                     setDragState({
                         type: 'create',
                         startX: e.clientX,
                         startY: e.clientY,
                         currentNote: {
                             start: newStart,
                             duration: 0.25 * samplesPerBeat,
                             note: noteIndex
                         }
                     });
                 }
            }}
            onMouseMove={(e) => {
                if (!dragState) return;
                const { samplesPerBeat, noteIndex: currentHoverNote } = getMouseInfo(e);
                const { zoom } = viewStateRef.current;

                const deltaX_px = e.clientX - dragState.startX;
                const deltaBeats = deltaX_px / zoom;
                const deltaSamples = deltaBeats * samplesPerBeat;
                
                if (dragState.type === 'move' && dragState.note && dragState.currentNote) {
                     const newStart = Math.max(0, dragState.note.start + deltaSamples);
                     const quantizedStartBeat = Math.floor((newStart/samplesPerBeat) * 16) / 16;
                     
                     setDragState(prev => prev ? ({
                         ...prev,
                         currentNote: {
                             ...prev.currentNote!,
                             start: quantizedStartBeat * samplesPerBeat,
                             note: Math.max(0, Math.min(127, currentHoverNote)) 
                         }
                     }) : null);
                     
                } else if (dragState.type === 'resize' && dragState.note && dragState.currentNote) {
                     const newDur = Math.max(samplesPerBeat/16, dragState.note.duration + deltaSamples);
                     setDragState(prev => prev ? ({
                         ...prev,
                         currentNote: { ...prev.currentNote!, duration: newDur }
                     }) : null);
                }
            }}
            onMouseUp={() => {
                if (!dragState || !dragState.currentNote) {
                    setDragState(null);
                    return;
                }
                const store = useProjectStore.getState();

                if (dragState.type === 'create') {
                     store.addNote(trackId, clipId, {
                         ...dragState.currentNote,
                         velocity: 100
                     });
                } else if (dragState.note) { // Move or Resize
                     // If it was a click (no move), maybe delete?
                     const isClick = dragState.type === 'move' && 
                                     dragState.note.start === dragState.currentNote.start && 
                                     dragState.note.note === dragState.currentNote.note;
                                     
                     if (isClick && dragState.type === 'move') {
                         store.removeNote(trackId, clipId, dragState.note.start, dragState.note.note);
                     } else {
                         store.updateNote(trackId, clipId, dragState.note.start, dragState.note.note, {
                             ...dragState.currentNote,
                             velocity: 100
                         });
                     }
                }
                setDragState(null);
            }}
        />
    );
};
