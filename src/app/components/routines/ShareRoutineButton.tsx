import React from 'react';
import { Share2 } from 'lucide-react';
import type { Routine } from '../../../lib/types';

interface ShareRoutineButtonProps {
  routine: Routine;
  onShare: () => void;
  isLoading?: boolean;
}

export function ShareRoutineButton({
  routine,
  onShare,
  isLoading = false,
}: ShareRoutineButtonProps) {
  if (!routine) return null;

  return (
    <button
      onClick={onShare}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Partager cette routine sur votre fil"
    >
      <Share2 size={18} />
      <span>Partager</span>
    </button>
  );
}
