import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserAvatar } from './user-avatar';

const { mockScene, useGLTFMock } = vi.hoisted(() => {
  const scene = {
    position: { sub: vi.fn() },
    traverse: vi.fn((cb: (child: { isMesh: boolean; castShadow?: boolean; receiveShadow?: boolean }) => void) => {
      cb({ isMesh: true });
    }),
    children: [],
  };

  const gltfMock = vi.fn(() => ({
    scene,
    animations: [],
  }));

  Object.assign(gltfMock, { preload: vi.fn() });

  return {
    mockScene: scene,
    useGLTFMock: gltfMock,
  };
});

vi.mock('@react-three/fiber', () => ({
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  useGLTF: useGLTFMock,
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
