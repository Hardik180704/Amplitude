import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/TopBar';
import { LibraryPanel } from './components/LibraryPanel';
import { MixerPanel } from './components/MixerPanel';
import { ArrangementView } from './components/ArrangementView';
import './App.css';

function App() {
  return (
    <AppShell 
        header={<TopBar />}
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
    );
}

export default App;
