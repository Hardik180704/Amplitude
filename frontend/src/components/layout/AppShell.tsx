import React from 'react';

// Shell Slots
interface AppShellProps {
    header: React.ReactNode;
    sidebar?: React.ReactNode;
    main: React.ReactNode;
    rightPanel?: React.ReactNode;
    bottomPanel?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ header, sidebar, main, rightPanel, bottomPanel }) => {
    return (
        <div className="h-screen w-screen grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] bg-bg-main text-text-primary overflow-hidden">
            {/* Header: Full width */}
            <header className="col-span-3 h-12 border-b border-white/5 bg-bg-header/50 backdrop-blur-md z-30 flex items-center px-4 shadow-lg">
                {header}
            </header>

            {/* Left Sidebar */}
            {sidebar && (
                <aside className="row-span-1 w-64 border-r border-white/5 bg-bg-panel/80 backdrop-blur-sm overflow-y-auto z-20 shadow-[4px_0_20px_-10px_rgba(0,0,0,0.5)]">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area */}
            <main className="relative overflow-hidden bg-bg-main z-10">
                {main}
            </main>

            {/* Right Panel */}
            {rightPanel && (
                <aside className="w-80 border-l border-white/5 bg-bg-panel z-20 shadow-[-4px_0_20px_-10px_rgba(0,0,0,0.5)] flex flex-col">
                    {rightPanel}
                </aside>
            )}

            {/* Bottom Panel: Full Width (below sidebar/main/right) */}
            {bottomPanel && (
                <footer className="col-span-3 h-64 border-t border-white/5 bg-bg-panel z-20">
                    {bottomPanel}
                </footer>
            )}
        </div>
    );
};
