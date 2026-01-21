import React, { useState } from 'react';

interface MixerChannelProps {
    id: number;
    name: string;
    onVolumeChange: (id: number, val: number) => void;
    onPanChange: (id: number, val: number) => void;
}

export const MixerChannel: React.FC<MixerChannelProps> = ({ id, name, onVolumeChange, onPanChange }) => {
    const [volume, setVolume] = useState(1.0);
    const [pan, setPan] = useState(0.0);

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        onVolumeChange(id, val);
    };

    const handlePan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setPan(val);
        onPanChange(id, val);
    };

    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            width: '80px', 
            background: '#222', 
            padding: '10px',
            margin: '2px',
            borderRadius: '4px',
            alignItems: 'center',
            color: '#eee'
        }}>
            <div>{name}</div>
            
            {/* Pan Knob */}
            <label style={{fontSize: '10px', marginTop: '10px'}}>Pan</label>
            <input 
                type="range" 
                min="-1" max="1" step="0.01" 
                value={pan} 
                onChange={handlePan} 
                style={{width: '60px'}} 
            />

            {/* Fader */}
            <div style={{height: '150px', display: 'flex', alignItems: 'center', marginTop: '10px'}}>
                <input 
                    type="range" 
                    min="0" max="1.0" step="0.01" 
                    value={volume} 
                    onChange={handleVolume}
                    style={{
                        writingMode: 'bt-lr', /* Webkit specific for vertical */
                        WebkitAppearance: 'slider-vertical',
                        width: '20px',
                        height: '100%'
                    }} 
                />
            </div>
            
            <div style={{fontSize: '10px'}}>{(volume * 100).toFixed(0)}%</div>
            
            <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                 <button style={{background: '#555', border: 'none', color: 'white', fontSize: '10px'}}>M</button>
                 <button style={{background: '#555', border: 'none', color: 'white', fontSize: '10px'}}>S</button>
            </div>
        </div>
    );
};
