import React, { useState, useEffect } from 'react';
import { AudioContextManager } from '../audio/AudioContextManager';

export const Transport: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Initialize engine on mount (or on user interaction if autoplay policy blocks)
        // For now, we wait for user to click "Initialize" or Play
    }, []);

    const togglePlay = async () => {
        const manager = AudioContextManager.getInstance();
        
        if (!isReady) {
            await manager.initialize();
            setIsReady(true);
        }

        if (isPlaying) {
            await manager.suspend();
            setIsPlaying(false);
            // In real app, we send STOP command to RingBuffer
        } else {
            await manager.resume();
            setIsPlaying(true);
            // In real app, we send PLAY command to RingBuffer
        }
    };

    return (
        <div className="transport-controls" style={{ padding: '20px', background: '#333', color: 'white' }}>
            <h2>Audio Engine Protocol</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    onClick={togglePlay}
                    style={{
                        padding: '10px 20px',
                        background: isPlaying ? '#ff4444' : '#44ff44',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isPlaying ? 'STOP' : 'PLAY'}
                </button>
                <div style={{ alignSelf: 'center' }}>
                    Status: {isReady ? 'Active' : 'Standby'}
                </div>
            </div>
        </div>
    );
};
