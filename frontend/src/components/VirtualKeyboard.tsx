import React, { useState } from 'react';
import { AudioContextManager } from '../audio/AudioContextManager';

interface VirtualKeyboardProps {
    trackId: number;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ trackId }) => {
    // Basic C Major Scale approx
    const notes = [
        { note: 60, name: 'C4', color: 'white' },
        { note: 61, name: 'C#4', color: 'black' },
        { note: 62, name: 'D4', color: 'white' },
        { note: 63, name: 'D#4', color: 'black' },
        { note: 64, name: 'E4', color: 'white' },
        { note: 65, name: 'F4', color: 'white' },
        { note: 66, name: 'F#4', color: 'black' },
        { note: 67, name: 'G4', color: 'white' },
        { note: 68, name: 'G#4', color: 'black' },
        { note: 69, name: 'A4', color: 'white' },
        { note: 70, name: 'A#4', color: 'black' },
        { note: 71, name: 'B4', color: 'white' },
        { note: 72, name: 'C5', color: 'white' },
    ];

    const styles = {
        white: {
            width: '40px',
            height: '150px',
            background: 'white',
            border: '1px solid black',
            display: 'inline-block',
            marginRight: '-1px',
            cursor: 'pointer'
        },
        black: {
            width: '30px',
            height: '100px',
            background: 'black',
            position: 'absolute' as 'absolute',
            border: '1px solid black',
            marginLeft: '-15px',
            zIndex: 1,
            cursor: 'pointer'
        },
        container: {
            position: 'relative' as 'relative',
            marginTop: '20px',
            height: '160px',
            padding: '10px',
            background: '#222'
        }
    };

    const handleNoteOn = (note: number) => {
        // Send NoteOn Command (Mocking helper)
        const cmd = {
            Midi: {
                NoteOn: { track_id: trackId, note, velocity: 100 }
            }
        };
        // In real app, we need to map this structure to what Rust expects via valid JSON
        // Since we are using shared commands, we likely send:
        // { type: "NoteOn", trackId, note, velocity: 100 } if we have a JS adapter
        // Or directly if we exposed the exact JSON structure.
        
        // Let's assume AudioContextManager handles the packaging for now
        // But wait, SharedRingBuffer expects binary struct command usually? 
        // Or if we use postMessage (legacy bridge):
        
        AudioContextManager.getInstance().sendCommand({
            type: "NoteOn",
            trackId,
            note,
            velocity: 100
        });
    };

    const handleNoteOff = (note: number) => {
        AudioContextManager.getInstance().sendCommand({
            type: "NoteOff",
            trackId,
            note
        });
    };

    return (
        <div style={styles.container}>
            {notes.map((n, i) => (
                <div
                    key={n.note}
                    style={n.color === 'white' ? styles.white : styles.black}
                    onMouseDown={() => handleNoteOn(n.note)}
                    onMouseUp={() => handleNoteOff(n.note)}
                    onMouseLeave={() => handleNoteOff(n.note)}
                >
                    {n.color === 'white' && <div style={{marginTop: '120px', textAlign: 'center', fontSize: '10px'}}>{n.name}</div>}
                </div>
            ))}
        </div>
    );
};
