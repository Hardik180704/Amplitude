import React, { useEffect, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';

interface VirtualKeyboardProps {
    trackId: number;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ trackId }) => {
    // 2 Octaves: C3 (48) to C5 (72)
    // 2 Octaves: C3 (48) to C5 (72)
    const startNote = 48;
    const numKeys = 25; // C3 to C5

    const keys = Array.from({ length: numKeys }, (_, i) => {
        const midi = startNote + i;
        const noteInOctave = midi % 12;
        // Black keys: 1(C#), 3(D#), 6(F#), 8(G#), 10(A#)
        const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
        const name = getNoteName(midi);
        return { midi, isBlack, name };
    });

    const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

    const handleNoteOn = (note: number) => {
        if (trackId === null) return;
        audioEngine.triggerAttack(trackId, note, 100);
        setActiveNotes(prev => new Set(prev).add(note));
    };

    const handleNoteOff = (note: number) => {
        if (trackId === null) return;
        audioEngine.triggerRelease(trackId, note);
        setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
        });
    };

    // Keyboard support
    useEffect(() => {
        const keyMap: Record<string, number> = {
            'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65, 't': 66,
            'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const note = keyMap[e.key];
            if (note) handleNoteOn(note);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const note = keyMap[e.key];
            if (note) handleNoteOff(note);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [trackId]);

    return (
        <div className="w-full h-full flex flex-col bg-[#111] border-t border-white/10 select-none">
            {/* Header */}
            <div className="h-6 px-2 bg-[#222] border-b border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <span>Virtual Keyboard (Track {trackId})</span>
                <span>Use 'A-K' to play</span>
            </div>
            
            {/* Keys Container */}
            <div className="flex-1 flex relative overflow-hidden bg-[#050505] p-1">
                {keys.map((k) => {
                    // Render only White keys first in flex flow, absolute black keys on top?
                    // Or standard flex logic with negative margins for black keys.
                    // Let's use the 'flex' approach where black keys sit between white keys.
                    // Actually, usually absolute positioning black keys on top of white keys is easier for correct proportions.
                    // But for simple "Draw all keys", let's loop:
                    // If it's a white key, render it. 
                    // If the NEXT key is black, render it in a wrapper?
                    
                    // Simple approach: Render all white keys as flex items. Render black keys absolutely on top based on position.
                    return null;
                })}
                
                {/* Render White Keys */}
                <div className="flex w-full h-full gap-[1px]">
                     {keys.filter(k => !k.isBlack).map(k => (
                         <div 
                            key={k.midi}
                            onMouseDown={() => handleNoteOn(k.midi)}
                            onMouseUp={() => handleNoteOff(k.midi)}
                            onMouseLeave={() => activeNotes.has(k.midi) && handleNoteOff(k.midi)}
                            className={`flex-1 h-full rounded-b-sm cursor-pointer transition-colors relative flex items-end justify-center pb-2 text-[10px] font-bold text-gray-400
                                ${activeNotes.has(k.midi) ? 'bg-blue-200 shadow-[inset_0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white hover:bg-gray-100'}
                            `}
                         >
                            {k.name}
                            
                            {/* Check if there is a black key after this one (and it's not the last) */}
                            {keys.find(bk => bk.midi === k.midi + 1 && bk.isBlack) && (
                                <div 
                                    className={`absolute top-0 -right-[30%] w-[60%] h-[60%] z-10 rounded-b-sm cursor-pointer border-x border-b border-black/50
                                        ${activeNotes.has(k.midi + 1) ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-black shadow-lg bg-gradient-to-b from-gray-800 to-black'}
                                    `}
                                    onMouseDown={(e) => { e.stopPropagation(); handleNoteOn(k.midi + 1); }}
                                    onMouseUp={(e) => { e.stopPropagation(); handleNoteOff(k.midi + 1); }}
                                    onMouseLeave={(e) => { if (activeNotes.has(k.midi + 1)) { e.stopPropagation(); handleNoteOff(k.midi + 1); }}}
                                ></div>
                            )}
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};

function getNoteName(midi: number) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
}
