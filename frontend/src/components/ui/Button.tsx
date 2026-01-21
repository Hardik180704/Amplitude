import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const base = "font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-main focus:ring-accent-primary disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-accent-primary text-white hover:bg-accent-primary/90",
        secondary: "bg-bg-panel border border-border-subtle text-text-primary hover:bg-bg-hover",
        danger: "bg-accent-danger text-white hover:bg-accent-danger/90",
        ghost: "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
    };
    
    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base"
    };

    return (
        <button 
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
