import React from 'react';
import type { ModConnection, ModSource, ModTarget } from '../store';

interface ModMatrixProps {
    connections: ModConnection[];
    onUpdate: (connections: ModConnection[]) => void;
}

export const ModulationMatrixView: React.FC<ModMatrixProps> = ({ connections, onUpdate }) => {
    
    const handleAmountChange = (index: number, val: number) => {
        const newConns = [...connections];
        newConns[index].amount = val;
        onUpdate(newConns);
    };

    const addConnection = () => {
        // Default new connection
        const newConn: ModConnection = {
            source: { Lfo: 0 },
            target: 'FilterCutoff',
            amount: 0.5
        };
        onUpdate([...connections, newConn]);
    };

    const removeConnection = (index: number) => {
        const newConns = connections.filter((_, i) => i !== index);
        onUpdate(newConns);
    };
    
    // Helpers to stringify complex enums
    const sourceToString = (s: ModSource) => {
        if (typeof s === 'string') return s;
        if ('Lfo' in s) return `LFO ${s.Lfo + 1}`;
        if ('Envelope' in s) return `Env ${s.Envelope + 1}`;
        return 'Unknown';
    };

    const targetToString = (t: ModTarget) => {
        if (typeof t === 'string') return t;
        if ('OscPitch' in t) return `Osc ${t.OscPitch + 1} Pitch`;
        return 'Unknown';
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-zinc-100 font-bold text-sm uppercase tracking-wider">Modulation Matrix</h3>
                <button 
                    onClick={addConnection}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded"
                >
                    + Add Slot
                </button>
            </div>
            
            <div className="space-y-2">
                {connections.length === 0 && (
                    <div className="text-zinc-600 text-xs italic text-center py-4">
                        No active modulations
                    </div>
                )}
                
                {connections.map((conn, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                        {/* Source */}
                        <div className="w-24 text-xs text-cyan-400 font-mono">
                            {sourceToString(conn.source)}
                        </div>
                        
                        <span className="text-zinc-600">→</span>
                        
                        {/* Target */}
                        <div className="w-24 text-xs text-rose-400 font-mono">
                            {targetToString(conn.target)}
                        </div>
                        
                        {/* Amount Slider */}
                        <input 
                            type="range" 
                            min="-1" max="1" step="0.01" 
                            value={conn.amount}
                            onChange={(e) => handleAmountChange(i, parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="w-10 text-right text-xs text-zinc-400">
                            {(conn.amount * 100).toFixed(0)}%
                        </span>
                        
                        {/* Delete */}
                        <button 
                            onClick={() => removeConnection(i)}
                            className="text-zinc-600 hover:text-red-500 ml-2"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
