import React from 'react';

// Mock types until we bridge Rust structs fully
interface MidiNote {
    start: number;
    duration: number;
    note: number;
    velocity: number;
}

interface PianoRollProps {
    notes: MidiNote[];
    width: number;
    height: number;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ notes, width, height }) => {
    const NOTE_HEIGHT = 10; // Pixels per semitone
    const PPI = 50; // Pixels per beat/interval
    
    // Viewport range
    const MAX_NOTE = 84; // C6
    const MIN_NOTE = 48; // C3
    const RANGE = MAX_NOTE - MIN_NOTE;
    
    // SVG Coordinate system
    // Y = 0 is MAX_NOTE
    // Y = height is MIN_NOTE
    // So Y = (MAX_NOTE - note) * NOTE_HEIGHT
    
    return (
        <div style={{ width: width, height: height, background: '#111', overflow: 'hidden', border: '1px solid #444', position: 'relative' }}>
             {/* Grid Lines */}
             {Array.from({ length: RANGE }).map((_, i) => (
                <div 
                    key={i} 
                    style={{
                        position: 'absolute', 
                        top: i * NOTE_HEIGHT, 
                        width: '100%', 
                        height: '1px', 
                        background: (MAX_NOTE - i) % 12 === 0 ? '#444' : '#222'
                    }} 
                />
             ))}
             
             {/* Notes */}
             {notes.map((n, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: n.start * PPI,
                        width: n.duration * PPI,
                        top: (MAX_NOTE - n.note) * NOTE_HEIGHT,
                        height: NOTE_HEIGHT - 1,
                        background: '#00afdb',
                        borderRadius: '2px',
                        border: '1px solid black'
                    }}
                />
             ))}
        </div>
    );
};
