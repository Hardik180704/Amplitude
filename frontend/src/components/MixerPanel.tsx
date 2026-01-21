import React from 'react';
import { MixerChannel } from './MixerChannel';
import { AudioContextManager } from '../audio/AudioContextManager';

export const MixerPanel: React.FC = () => {
    return (
       <div className="h-full flex flex-col">
           <div className="h-8 bg-bg-header border-b border-border-subtle flex items-center px-4 justify-between">
               <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Mixer Console</span>
               <div className="text-[10px] text-text-muted">Stereo Output</div>
           </div>
           <div className="flex-1 p-2 flex gap-2 overflow-x-auto bg-bg-panel/50">
               {/* Hardcoded 2 tracks for now, will map store later */}
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
               <MixerChannel 
                 id={2} name="Track 3" 
                 onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
                 onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
               />
               <MixerChannel 
                 id={3} name="Track 4" 
                 onVolumeChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_GAIN", {trackId: id, value: val})}
                 onPanChange={(id, val) => AudioContextManager.getInstance().sendCommand("SET_PAN", {trackId: id, value: val})}
               />
           </div>
       </div>
    );
};
