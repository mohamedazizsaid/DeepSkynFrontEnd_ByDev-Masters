import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export interface AdData {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  sponsor: string;
}

interface AdCardProps {
  ad: AdData;
  onClose?: () => void;
  onView?: (adId: string) => void;
}

export function AdCard({ ad, onClose, onView }: AdCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6"
    >
      {/* Ad Badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <span className="text-xs font-semibold text-[#6B7280] tracking-wider">
          SPONSORISÉ
        </span>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Ad Content */}
      <div
        onClick={() => onView?.(ad.id)}
        className="cursor-pointer group"
      >
        {/* Ad Image */}
        <div className="relative h-48 bg-[#F3F4F6] overflow-hidden">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Ad Copy */}
        <div className="p-4">
          <h3 className="font-bold text-[#111827] mb-1 group-hover:text-[#0EA5E9] transition-colors">
            {ad.title}
          </h3>
          <p className="text-sm text-[#6B7280] mb-3 line-clamp-2">
            {ad.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">
              par {ad.sponsor}
            </span>
            <motion.div
              whileHover={{ x: 4 }}
              className="text-sm font-semibold text-[#0EA5E9] group-hover:translate-x-1 transition-transform"
            >
              En savoir plus →
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
