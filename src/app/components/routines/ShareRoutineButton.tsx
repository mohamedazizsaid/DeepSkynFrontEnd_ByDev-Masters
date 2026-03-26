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
      variant="primary"
      size="md"
      title="Partager cette routine sur votre fil"
    >
      <Share2 size={18} />
      <span>Partager</span>
    </Button>
  );
}
