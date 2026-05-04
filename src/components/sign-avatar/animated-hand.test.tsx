import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedHand } from './animated-hand';

const frames = [
  {
    hand_right_keypoints: Array.from({ length: 21 }, (_value, index) => ({
      id: String(index),
      x: 0,
      y: 0,
      z: 0,
    })),
    hand_left_keypoints: null,
    pose_keypoints: [],
  },
];

const metadata = {
  gloss: 'TEST',
  fps: 30,
  total_frames: 1,
};

describe('AnimatedHand', () => {
  it('renders a canvas and gloss label', () => {
    render(
      <AnimatedHand
        frames={frames}
        metadata={metadata}
        autoPlay={false}
        width={200}
        height={260}
      />
    );

    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeTruthy();
  });
});
