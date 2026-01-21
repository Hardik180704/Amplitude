import React, { useState } from 'react';
import { useProjectStore } from '../store';
import { AudioContextManager } from '../audio/AudioContextManager';

export const TopBar: React.FC = () => {
    const { project, setProject } = useProjectStore();
    const [status, setStatus] = useState<string>('');

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project)
            });
            const text = await res.text();
            setStatus(text);
            setTimeout(() => setStatus(''), 2000);
        } catch (e) {
            setStatus('Error saving');
        }
    };

    const handleLoad = async () => {
        const name = prompt("Enter project name to load:");
        if (!name) return;
        
        setStatus('Loading...');
        try {
            const res = await fetch(`/api/projects/load?name=${name}`);
            const data = await res.json();
            if (data) {
                setProject(data);
                setStatus(`Loaded ${data.name}`);
                
                // Hydrate Engine
                AudioContextManager.getInstance().sendCommand({
                    type: "LoadProject",
                    project: data
                });
            } else {
                setStatus('Project not found');
            }
        } catch (e) {
            setStatus('Error loading');
        }
    };

    return (
        <div style={{ height: '40px', background: '#333', display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white', borderBottom: '1px solid #555' }}>
            <div style={{ fontWeight: 'bold', marginRight: '20px' }}>Amplitude DAW</div>
            <button onClick={handleSave} style={{ marginRight: '10px' }}>Save Project</button>
            <button onClick={handleLoad} style={{ marginRight: '10px' }}>Load Project</button>
            <span style={{ marginLeft: 'auto', fontSize: '0.8em', color: '#aaa' }}>{status}</span>
        </div>
    );
};
