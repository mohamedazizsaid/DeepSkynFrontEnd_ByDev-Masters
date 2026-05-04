import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoAccessibilityPlayer } from './video-accessibility-player';

vi.mock('../sign-avatar/pro-sign-avatar', () => ({
  ProSignAvatar: () => null,
}));

vi.mock('../../lib/services/speech-to-text.service', () => ({
  getSpeechToTextService: () => ({
    transcribeAudioElement: vi.fn(),
    stop: vi.fn(),
  }),
}));

describe('VideoAccessibilityPlayer', () => {
  it('renders a video element', () => {
    const { container } = render(
      <VideoAccessibilityPlayer
        videoUrl="https://example.com/video.mp4"
        showAvatar={false}
        showTranscription={false}
      />
    );

    expect(container.querySelector('video')).toBeTruthy();
  });
});
