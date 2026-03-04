import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-[#374151]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-3 ${icon ? 'pl-10' : ''} bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl 
            text-[#111827] placeholder:text-[#9CA3AF]
            focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20
            transition-all duration-200
            ${error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-[#EF4444] animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
