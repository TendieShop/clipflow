import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VideoPreview } from './VideoPreview';

describe('VideoPreview', () => {
  const mockVideo = {
    id: '1',
    name: 'test-video.mp4',
    path: '/videos/test-video.mp4',
    duration: 120,
    status: 'ready' as const,
  };

  const defaultProps = {
    video: mockVideo,
    isSelected: false,
    onSelect: vi.fn(),
  };

  it('renders video name', () => {
    const { container } = render(<VideoPreview {...defaultProps} />);
    expect(container.querySelector('.video-name')?.textContent).toBe('test-video.mp4');
  });

  it('renders video duration formatted', () => {
    const { container } = render(<VideoPreview {...defaultProps} />);
    expect(container.querySelector('.video-duration')?.textContent).toBe('2:00');
  });

  it('renders ready status badge', () => {
    const { container } = render(<VideoPreview {...defaultProps} />);
    expect(container.querySelector('.video-status')?.textContent).toBe('Ready');
  });

  it('renders importing status', () => {
    const importingVideo = { ...mockVideo, status: 'importing' as const };
    const { container } = render(<VideoPreview {...defaultProps} video={importingVideo} />);
    expect(container.querySelector('.video-status')?.textContent).toBe('Importing...');
  });

  it('renders processing status', () => {
    const processingVideo = { ...mockVideo, status: 'processing' as const };
    const { container } = render(<VideoPreview {...defaultProps} video={processingVideo} />);
    expect(container.querySelector('.video-status')?.textContent).toBe('Processing...');
  });

  it('renders done status', () => {
    const doneVideo = { ...mockVideo, status: 'done' as const };
    const { container } = render(<VideoPreview {...defaultProps} video={doneVideo} />);
    expect(container.querySelector('.video-status')?.textContent).toBe('Done');
  });

  it('applies selected class when isSelected is true', () => {
    const { container } = render(<VideoPreview {...defaultProps} isSelected={true} />);
    expect(container.querySelector('.video-preview')?.className.includes('selected')).toBe(true);
  });

  it('does not apply selected class when isSelected is false', () => {
    const { container } = render(<VideoPreview {...defaultProps} isSelected={false} />);
    expect(container.querySelector('.video-preview')?.className.includes('selected')).toBe(false);
  });
});
