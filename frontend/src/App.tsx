import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Transport } from './components/Transport'
import { MixerChannel } from './components/MixerChannel';
import { AudioContextManager } from './audio/AudioContextManager';
import { TopBar } from './components/TopBar';
import { useProjectStore } from './store';
import { ExportDialog } from './components/ExportDialog';

function App() {
  const { project, addTrack } = useProjectStore();

  return (
    <div className="App">
       <TopBar />
       <div style={{ padding: '20px' }}>
          <h2>{project.name}</h2>
          <button onClick={addTrack}>Add Track</button>
          
          <ExportDialog />
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Amplitude DAW</h1>
      <Transport />
      
      <div style={{display: 'flex', gap: '10px', marginTop: '20px', padding: '20px', background: '#333'}}>
          <MixerChannel 
            id={0} 
            name="Track 1" 
            onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
            onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
          />
           <MixerChannel 
            id={1} 
            name="Track 2" 
            onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
            onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
          />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
