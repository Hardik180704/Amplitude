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
            <header className="col-span-3 h-12 border-b border-border-subtle bg-bg-header z-10">
                {header}
            </header>

            {/* Left Sidebar */}
            {sidebar && (
                <aside className="row-span-1 w-64 border-r border-border-subtle bg-bg-panel overflow-y-auto">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area */}
            <main className="relative overflow-hidden bg-bg-main">
                {main}
            </main>

            {/* Right Panel */}
            {rightPanel && (
                <aside className="w-80 border-l border-border-subtle bg-bg-panel overflow-y-auto">
                    {rightPanel}
                </aside>
            )}

            {/* Bottom Panel: Full Width (below sidebar/main/right) */}
            {bottomPanel && (
                <footer className="col-span-3 h-64 border-t border-border-subtle bg-bg-panel z-10">
                    {bottomPanel}
                </footer>
            )}
        </div>
    );
};
