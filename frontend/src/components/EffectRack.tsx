import React from 'react';

interface EffectRackProps {
    trackId: number;
}

export const EffectRack: React.FC<EffectRackProps> = ({ trackId }) => {
    return (
        <div style={{ marginTop: '10px', padding: '10px', background: '#444', color: 'white' }}>
            <h4>Track {trackId} Effects</h4>
            <button onClick={() => console.log("Add EQ")}>+ EQ</button>
            <button onClick={() => console.log("Add Comp")}>+ Compressor</button>
            <button onClick={() => console.log("Add Delay")}>+ Delay</button>
            
            <div style={{marginTop: '10px', border: '1px solid #666', padding: '5px'}}>
                <div><strong>EQ (Mock)</strong></div>
                <label>Low: <input type="range" /></label>
                <label>Mid: <input type="range" /></label>
                <label>High: <input type="range" /></label>
            </div>
        </div>
    );
};
