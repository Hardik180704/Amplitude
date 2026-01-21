import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    onChange: (val: number) => void;
    size?: number;
    color?: string;
}

export const Knob: React.FC<KnobProps> = ({ 
    value, 
    min = 0, 
    max = 100, 
    label, 
    onChange, 
    size = 40,
    color = '#3b82f6' // Default to our Sapphire Neon Blue
}) => {
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
        } else {
             window.removeEventListener('mousemove', handleMouseMove);
             window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, onChange]);

    // Visual calculations
    const percentage = (value - min) / (max - min);
    // 270 degrees sweep (-135 to +135)
    const angle = -135 + (percentage * 270);
    
    // SVG Geometry
    const cx = size / 2;
    const cy = size / 2;
    const r = (size / 2) - 4; // Padding
    const indicatorR = r * 0.6;
    
    // Convert angle to indicator position
    const rad = (angle - 90) * (Math.PI / 180);
    const ix = cx + indicatorR * Math.cos(rad);
    const iy = cy + indicatorR * Math.sin(rad);

    return (
        <div className="flex flex-col items-center gap-1 select-none group relative">
            <div 
                className="relative cursor-ns-resize"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
            >
                 {/* Shadow / Base */}
                 <div className="absolute inset-0 rounded-full bg-[#0a0e17] shadow-lg border border-[#333]"></div>
                 
                 {/* Metallic Cap Gradient */}
                 <div 
                    className="absolute inset-[2px] rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #2a2e37 0%, #111 100%)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
                    }}
                 ></div>
                 
                 {/* Indicator Line (SVG) */}
                 <svg width={size} height={size} className="absolute inset-0 pointer-events-none drop-shadow-md">
                     <line 
                        x1={cx} y1={cy} 
                        x2={ix} y2={iy} 
                        stroke={color} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        className="transition-colors"
                        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                     />
                 </svg>
                 
                 {/* Active Ring (Optional, can add SVG arc later for value) */}
            </div>
            {label && <span className="text-[9px] font-bold text-gray-500 tracking-wider">{label}</span>}
        </div>
    );
};
