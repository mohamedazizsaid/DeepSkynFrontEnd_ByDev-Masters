import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEyeClick } from './useEyeClick';

type EyeState = 'open' | 'closed';

const trackingState = {
  isEnabled: true,
  cursorPos: { x: 50, y: 50 },
  eyeStatus: { left: 'open' as EyeState, right: 'open' as EyeState },
};

vi.mock('../components/EyeTrackingContext', () => ({
  useEyeTracking: () => trackingState,
}));

function HookTarget({
  onLeftClick,
  onRightClick,
  onHoverChange,
}: {
  onLeftClick?: () => void;
  onRightClick?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}) {
  const ref = useEyeClick<HTMLDivElement>(onLeftClick, onRightClick, {
    clickDelay: 300,
    onHoverChange,
  });

  return <div data-testid="target" ref={ref}>target</div>;
}

function setTargetBounds() {
  const target = screen.getByTestId('target');
  Object.defineProperty(target, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    configurable: true,
  });
}

describe('useEyeClick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    trackingState.isEnabled = true;
    trackingState.cursorPos = { x: 50, y: 50 };
    trackingState.eyeStatus = { left: 'open', right: 'open' };
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('triggers left click when right eye closes over target', () => {
    const onLeftClick = vi.fn();
    trackingState.eyeStatus = { left: 'open', right: 'closed' };

    render(<HookTarget onLeftClick={onLeftClick} />);
    setTargetBounds();

    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(onLeftClick).toHaveBeenCalledTimes(1);
  });

  it('triggers right click when left eye closes over target', () => {
    const onRightClick = vi.fn();
    trackingState.eyeStatus = { left: 'closed', right: 'open' };

    render(<HookTarget onRightClick={onRightClick} />);
    setTargetBounds();

    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(onRightClick).toHaveBeenCalledTimes(1);
  });

  it('reports hover changes when cursor enters and leaves target', () => {
    const onHoverChange = vi.fn();

    const { rerender } = render(<HookTarget onHoverChange={onHoverChange} />);
    setTargetBounds();

    trackingState.cursorPos = { x: 20, y: 20 };
    rerender(<HookTarget onHoverChange={onHoverChange} />);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    trackingState.cursorPos = { x: 150, y: 150 };
    rerender(<HookTarget onHoverChange={onHoverChange} />);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onHoverChange).toHaveBeenCalledWith(true);
    expect(onHoverChange).toHaveBeenCalledWith(false);
  });
});
