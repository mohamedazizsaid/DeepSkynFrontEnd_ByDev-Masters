import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserAvatar } from './user-avatar';

vi.mock('@react-three/fiber', () => ({
  useFrame: () => undefined,
}));

const mockScene = {
  position: { sub: vi.fn() },
  traverse: vi.fn((cb: (child: { isMesh: boolean; castShadow?: boolean; receiveShadow?: boolean }) => void) => {
    cb({ isMesh: true });
  }),
  children: [],
};

const useGLTF = vi.fn(() => ({
  scene: mockScene,
  animations: [],
}));

useGLTF.preload = vi.fn();

vi.mock('@react-three/drei', () => ({
  useGLTF,
  useAnimations: () => ({
    mixer: {
      stopAllAction: vi.fn(),
      clipAction: vi.fn(() => ({
        reset: vi.fn(),
        loop: null,
        clampWhenFinished: false,
        play: vi.fn(),
      })),
      update: vi.fn(),
    },
  }),
}));

vi.mock('three', () => {
  class Vector3 {
    x = 0;
    y = 0;
    z = 0;
  }

  class Box3 {
    setFromObject() {
      return this;
    }

    getCenter() {
      return new Vector3();
    }
  }

  return {
    Box3,
    Vector3,
    LoopOnce: 'LoopOnce',
  };
});

describe('UserAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <UserAvatar gestures={[]} isAnimating={false} />
    );

    expect(container.querySelector('group')).toBeTruthy();
  });
});
