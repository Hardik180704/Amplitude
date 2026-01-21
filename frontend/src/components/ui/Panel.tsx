import React from 'react';

interface PanelProps {
    title?: string;
    children: React.ReactNode;
    className?: string; // Allow overrides
}

export const Panel: React.FC<PanelProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-bg-panel border border-border-subtle rounded-lg shadow-panel flex flex-col overflow-hidden ${className}`}>
            {title && (
                <div className="px-3 py-2 bg-bg-header border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-text-muted select-none">
                    {title}
                </div>
            )}
            <div className="flex-1 p-3 relative">
                {children}
            </div>
        </div>
    );
};
