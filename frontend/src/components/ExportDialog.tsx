import React, { useState } from 'react';

export const ExportDialog: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        
        // Mock export process simulating backend/wasm work
        const totalSteps = 10;
        for (let i = 0; i <= totalSteps; i++) {
             await new Promise(r => setTimeout(r, 200));
             setProgress((i / totalSteps) * 100);
        }
        
        setIsExporting(false);
        alert("Export Complete! (Mock Download)");
    };

    return (
        <div style={{
            position: 'fixed', bottom: '20px', right: '20px', 
            background: '#222', padding: '15px', border: '1px solid #555', color: 'white'
        }}>
            <h4>Export Project</h4>
            {isExporting ? (
                <div>
                    <div>Rendering... {progress.toFixed(0)}%</div>
                    <div style={{width: '200px', height: '10px', background: '#444', marginTop: '5px'}}>
                        <div style={{width: `${progress}%`, height: '100%', background: '#00afdb'}} />
                    </div>
                </div>
            ) : (
                <button onClick={handleExport}>Export WAV</button>
            )}
        </div>
    );
};
