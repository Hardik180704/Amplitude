import React from 'react';
import { Button } from './ui/Button';
import { useProjectStore } from '../store';
import { Timeline } from './canvas/Timeline';

export const ArrangementView: React.FC = () => {
    const { project, addTrack, deleteTrack } = useProjectStore();
    
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
                        <div key={t.id} className="h-24 border-b border-border-subtle p-2 bg-bg-panel group relative hover:bg-bg-hover transition-colors">
                            {/* Track Color Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.muted ? 'bg-text-muted' : 'bg-accent-primary'}`} />
                            
                            <div className="ml-2 flex flex-col h-full justify-between">
                                <div className="text-xs font-bold text-text-primary uppercase tracking-wide truncate">{t.name}</div>
                                
                                <div className="flex gap-2 mb-1">
                                    <button className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border transition-colors ${t.muted ? 'bg-accent-warning text-black border-accent-warning' : 'bg-bg-main border-border-subtle text-text-muted hover:border-text-muted'}`}>M</button>
                                    <button className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border transition-colors ${t.soloed ? 'bg-accent-secondary text-white border-accent-secondary' : 'bg-bg-main border-border-subtle text-text-muted hover:border-text-muted'}`}>S</button>
                                    <button 
                                        className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border border-transparent text-text-muted hover:text-accent-danger hover:border-accent-danger/50 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Track"
                                        onClick={(e) => { e.stopPropagation(); deleteTrack(t.id); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-2">
                        <Button size="sm" onClick={() => addTrack()} variant="secondary" className="w-full text-[10px] uppercase tracking-widest border-dashed opacity-50 hover:opacity-100">
                            + Add Track
                        </Button>
                    </div>
                </div>
                
                {/* Timeline Grid */}
                <div className="flex-1 bg-bg-main relative overflow-hidden">
                    <Timeline />
                    

                </div>
          </div>
      </div>
    );
};
