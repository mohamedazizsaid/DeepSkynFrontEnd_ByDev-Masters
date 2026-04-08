import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className = '',
  children,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#0EA5E9] text-white hover:bg-[#0284C7] focus:ring-[#0EA5E9] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-gradient-to-r from-[#F9A8D4] to-[#FED7AA] text-[#111827] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#F9A8D4]',
    outline: 'border-2 border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 hover:border-[#0EA5E9] hover:bg-[#F9FAFB] dark:hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#0EA5E9]',
    ghost: 'text-[#4B5563] dark:text-slate-300 hover:bg-[#F3F4F6] dark:hover:bg-slate-800 hover:text-[#111827] dark:hover:text-slate-100 focus:ring-[#0EA5E9]'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`ds-btn ${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </motion.button>
  );
}
