import React from 'react';
import { Html } from '@react-three/drei';
import { FaceZoneData } from './Face3DViewer';

interface FaceTagProps {
  zone: FaceZoneData;
  matchedProducts: string[];
  isActive: boolean;
  onClick: () => void;
}

export function FaceTag({ zone, matchedProducts, isActive, onClick }: FaceTagProps) {
  if (matchedProducts.length === 0) return null;

  return (
    <Html
      position={zone.position}
      center
      distanceFactor={4}
      style={{ pointerEvents: 'auto' }}
      zIndexRange={[100, 0]}
    >
      <div
        onClick={onClick}
        className={`cursor-pointer select-none transition-all duration-300 group ${
          isActive ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        <div
          className={`relative px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-sm ${
            isActive
              ? 'bg-[#0EA5E9] text-white shadow-[#0EA5E9]/40 font-bold'
              : 'bg-white/90 text-gray-700 border border-gray-200 shadow-black/5'
          }`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-1.5">
            {/* Pulsing dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? 'bg-white/90' : 'bg-[#0EA5E9]'
              }`}
              style={{
                animation: isActive ? 'none' : 'pulse 2s infinite',
              }}
            />
            {matchedProducts[0]}
            {matchedProducts.length > 1 && (
              <span className="opacity-60 ml-1">+{matchedProducts.length - 1}</span>
            )}
          </div>
        </div>

        {/* Connector line */}
        <div
          className={`w-px h-3 mx-auto transition-colors ${
            isActive ? 'bg-[#0EA5E9]' : 'bg-gray-300'
          }`}
        />
        <div
          className={`w-2 h-2 rounded-full mx-auto transition-colors ${
            isActive ? 'bg-[#0EA5E9] shadow-md shadow-[#0EA5E9]/50' : 'bg-white border border-gray-300'
          }`}
        />
      </div>
    </Html>
  );
}
