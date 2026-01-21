import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    onChange: (val: number) => void;
    size?: number;
}

export const Knob: React.FC<KnobProps> = ({ value, min = 0, max = 100, label, onChange }) => {
    // Basic interaction state
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number>(0);
    const startVal = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = value;
        document.body.style.cursor = 'ns-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startY.current - e.clientY;
            const range = max - min;
            // Sensitivity: 200px for full range
            const deltaVal = (deltaY / 200) * range;
            const newVal = Math.min(max, Math.max(min, startVal.current + deltaVal));
            onChange(newVal);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, onChange]);

    // Vis calculation
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270); // 270 degree range

    return (
        <div className="flex flex-col items-center gap-1 select-none group">
            <div 
                className="relative w-10 h-10 rounded-full bg-bg-main border-2 border-border-subtle group-hover:border-accent-primary/50 transition-colors cursor-ns-resize shadow-md"
                onMouseDown={handleMouseDown}
            >
                 {/* Progress Arc (Simplified as rotate div for now, Canvas later) */}
                 <div 
                    className="absolute w-1 h-3 bg-accent-primary rounded-full top-1 left-1/2 -ml-0.5 origin-[50%_16px]"
                    style={{ transform: `rotate(${rotation}deg)` }}
                 />
            </div>
            {label && <span className="text-[10px] text-text-muted font-mono">{label}</span>}
        </div>
    );
};
