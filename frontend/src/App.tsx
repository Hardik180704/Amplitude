import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Transport } from './components/Transport'
import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/TopBar';
import { Panel } from './components/ui/Panel';
import { Button } from './components/ui/Button';
import { PianoRoll } from './components/PianoRoll';
import { useProjectStore } from './store';
import { MixerChannel } from './components/MixerChannel';
import { AudioContextManager } from './audio/AudioContextManager';

function App() {
  const { project, addTrack } = useProjectStore();

  const Header = <TopBar />;
  
  const Sidebar = (
      <div className="p-2 gap-2 flex flex-col h-full">
         <Panel title="Library" className="h-1/3">
             <div className="text-sm text-text-muted">Samples...</div>
         </Panel>
         <Panel title="Project" className="flex-1">
             <div className="p-2">
                 <h3 className="font-bold text-accent-primary mb-2">{project.name}</h3>
                 <div className="flex flex-col gap-2">
                     {project.tracks.map(t => (
                         <div key={t.id} className="text-xs p-1 bg-bg-hover rounded border border-border-subtle">
                             {t.name}
                         </div>
                     ))}
                     <Button size="sm" onClick={addTrack} variant="secondary">Order New Track</Button>
                 </div>
             </div>
         </Panel>
      </div>
  );

  const Main = (
      <div className="relative w-full h-full bg-bg-main p-4">
          {/* Placeholder Arrangement View */}
           <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-20 text-4xl font-bold select-none">
               ARRANGEMENT VIEW
           </div>
           
           {/* Mock Piano Roll over top for checking */}
           <div className="absolute top-10 left-10 p-4 bg-bg-panel border border-border-subtle shadow-xl rounded-lg">
                <h4 className="mb-2 text-xs font-bold text-text-secondary uppercase">Quick Roll</h4>
                <PianoRoll notes={[]} width={500} height={200} />
           </div>
      </div>
  );
  
  const Bottom = (
       <div className="h-full flex flex-col">
           <div className="h-8 bg-bg-header border-b border-border-subtle flex items-center px-2">
               <span className="text-xs font-bold text-text-secondary uppercase">Mixer</span>
           </div>
           <div className="flex-1 p-2 flex gap-2 overflow-x-auto">
               <MixerChannel 
                 id={0} name="Track 1" 
                 onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
                 onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
               />
               <MixerChannel 
                 id={1} name="Track 2" 
                 onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
                 onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
               />
           </div>
       </div>
  );

  return (
    <AppShell 
        header={Header}
        sidebar={Sidebar}
        main={Main}
        bottomPanel={Bottom}
    />
  );
}

export default App;
