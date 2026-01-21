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
        sidebar={<LibraryPanel />}
        main={<ArrangementView />}
        bottomPanel={<MixerPanel />}
    />
  );
}

export default App;
