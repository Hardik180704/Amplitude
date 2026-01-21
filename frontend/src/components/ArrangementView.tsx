import React from 'react';
import { Button } from './ui/Button';
import { useProjectStore } from '../store';
import { Timeline } from './canvas/Timeline';

export const ArrangementView: React.FC = () => {
    const { project, addTrack } = useProjectStore();
    
    return (
      <div className="relative w-full h-full bg-bg-main flex flex-col">
          {/* Timeline Header */}
          <div className="h-8 border-b border-border-subtle bg-bg-header flex overflow-hidden">
               {/* Tracks Header Column */}
               <div className="w-48 border-r border-border-subtle bg-bg-panel flex items-center px-4">
                   <span className="text-xs font-bold text-text-secondary uppercase">Tracks</span>
               </div>
               {/* Timeline Ruler */}
               <div className="flex-1 relative bg-bg-header">
                   {/* Mock Ruler */}
                   <div className="absolute top-0 bottom-0 left-0 w-[2000px] flex items-end pb-1 pl-2 text-[10px] text-text-muted font-mono pointer-events-none">
                       <span>1.1</span>
                       <span className="ml-[100px]">1.2</span>
                       <span className="ml-[100px]">1.3</span>
                       <span className="ml-[100px]">1.4</span>
                       <span className="ml-[100px]">2.1</span>
                       <span className="ml-[100px]">2.2</span>
                   </div>
               </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
                {/* Track Headers */}
                <div className="w-48 border-r border-border-subtle bg-bg-panel overflow-y-auto">
                    {project.tracks.map(t => (
                        <div key={t.id} className="h-24 border-b border-border-subtle p-2 bg-bg-panel hover:bg-bg-hover transition-colors group">
                            <div className="text-sm font-semibold text-text-primary mb-1">{t.name}</div>
                            <div className="flex gap-1">
                                <span className={`text-[10px] px-1 rounded border border-border-subtle cursor-pointer ${t.muted ? 'bg-accent-warning text-black' : 'text-text-muted'}`}>M</span>
                                <span className={`text-[10px] px-1 rounded border border-border-subtle cursor-pointer ${t.soloed ? 'bg-accent-secondary text-white' : 'text-text-muted'}`}>S</span>
                            </div>
                        </div>
                    ))}
                    <div className="p-2">
                        <Button size="sm" onClick={addTrack} variant="secondary" className="w-full text-xs">
                            + Add Track
                        </Button>
                    </div>
                </div>
                
                {/* Timeline Grid */}
                <div className="flex-1 bg-bg-main relative overflow-hidden">
                    <Timeline zoom={100} scrollX={0} />
                    
                    {/* Mock Piano Roll integrated (Floating for now) */}
                    <div className="absolute top-10 left-10 p-2 shadow-xl opacity-80 pointer-events-none">
                         <div className="bg-bg-panel/50 p-2 rounded border border-border-subtle text-xs text-text-secondary">
                            Clip Overlay (Placeholder)
                         </div>
                    </div>
                </div>
          </div>
      </div>
    );
};
