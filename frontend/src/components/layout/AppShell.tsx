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
        <div className="h-screen w-screen grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] bg-bg-main text-text-primary overflow-hidden gap-2 p-2">
            {/* Header: Full width, Floating */}
            <header className="col-span-3 h-14 bg-bg-panel/90 backdrop-blur-md border border-border rounded-xl z-30 flex items-center px-4 shadow-panel">
                {header}
            </header>

            {/* Left Sidebar: Floating Rack */}
            {sidebar && (
                <aside className="row-span-1 w-64 bg-bg-panel border border-border rounded-xl overflow-y-auto z-20 shadow-panel flex flex-col">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area: Floating Canvas */}
            <main className="relative overflow-hidden bg-bg-panel border border-border rounded-xl z-10 shadow-inner-depth">
                {main}
            </main>

            {/* Right Panel: Floating Rack */}
            {rightPanel && (
                <aside className="w-80 bg-bg-panel border border-border rounded-xl z-20 shadow-panel flex flex-col overflow-hidden">
                    {rightPanel}
                </aside>
            )}

            {/* Bottom Panel: Full Width Synth Deck */}
            {bottomPanel && (
                <footer className="col-span-3 h-64 bg-bg-panel border border-border rounded-xl z-20 shadow-panel overflow-hidden">
                    {bottomPanel}
                </footer>
            )}
        </div>
    );
};
