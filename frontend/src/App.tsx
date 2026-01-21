import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/TopBar';
import { Panel } from './components/ui/Panel';
import { MixerPanel } from './components/MixerPanel';
import { ArrangementView } from './components/ArrangementView';
import { ExportModal } from './components/modals/ExportModal';
import { useState } from 'react';
import './App.css';

function App() {
    const [isExportOpen, setIsExportOpen] = useState(false);

    return (
        <>
            <AppShell 
                header={<TopBar onExportClick={() => setIsExportOpen(true)} />}
        sidebar={
                <div className="p-4 space-y-4">
                    <Panel title="Instruments">
                        <div className="space-y-2 text-sm text-text-secondary">
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Keyboards</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Drums</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Guitars</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Bass</div>
                        </div>
                    </Panel>
                    <Panel title="Effects">
                         <div className="space-y-2 text-sm text-text-secondary">
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">Audio</div>
                            <div className="p-2 hover:bg-bg-hover rounded cursor-pointer">MIDI</div>
                        </div>
                    </Panel>
                    <Panel title="Resources">
                        <div className="p-2">
                            <button className="w-full py-2 px-3 flex items-center justify-center gap-2 bg-bg-main border border-border-subtle rounded hover:border-accent-primary/50 text-sm text-text-primary transition-colors dashed-border">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Import Audio
                            </button>
                            <div className="mt-2 text-[10px] text-text-muted text-center">
                                or drop files here
                            </div>
                        </div>
                    </Panel>
                </div>
            }
            main={
               <ArrangementView />
            }
            rightPanel={
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <MixerPanel />
                    </div>
                </div>
            }
            bottomPanel={null}
        />
        <ExportModal 
            isOpen={isExportOpen} 
            onClose={() => setIsExportOpen(false)} 
            onExport={(settings) => {
                console.log('Exporting with settings:', settings);
                setIsExportOpen(false);
                // TODO: Send to Backend
            }} 
        />
        </>
    );
}

export default App;
