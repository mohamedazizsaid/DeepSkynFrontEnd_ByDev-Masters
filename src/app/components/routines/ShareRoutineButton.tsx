import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '../button';
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
    <Button
      onClick={onShare}
      disabled={isLoading}
      loading={isLoading}
      variant="ghost"
      size="sm"
      className="!p-2.5 gap-0 rounded-2xl border border-cyan-200 bg-cyan-50/70 text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 hover:border-cyan-300 shadow-sm"
      title="Partager cette routine sur votre fil"
      aria-label="Partager cette routine"
    >
      <Share2 size={18} />
    </Button>
  );
}
