import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hoverable = false, onClick, ...props }: CardProps & React.HTMLAttributes<HTMLDivElement>) {
  const Component = hoverable ? motion.div : 'div';
  
  return (
    <Component
      className={`ds-card bg-white rounded-2xl p-6 shadow-md border border-[#E5E7EB] 
        ${hoverable ? 'cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1' : ''}
        ${className}`}
      onClick={onClick}
      {...props}
      {...(hoverable ? {
        whileHover: { y: -4 },
        whileTap: { scale: 0.98 }
      } : {})}
    >
      {children}
    </Component>
  );
}
