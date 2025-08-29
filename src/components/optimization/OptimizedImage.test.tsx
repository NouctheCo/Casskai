// Tests pour le composant OptimizedImage
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { OptimizedImage, useImagePreloader } from './ImageOptimized';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

// Mock global APIs
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(global, 'Image', {
  writable: true,
  configurable: true,
  value: class {
    onload = vi.fn();
    onerror = vi.fn();
    src = '';
    
    constructor() {
      setTimeout(() => this.onload?.(), 100);
    }
  },
});

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntersectionObserver.mockClear();
  });

  it('should render with basic props', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image"
        priority={true}
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
  });

  it('should generate WebP and AVIF sources', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image"
        priority={true}
      />
    );
    
    // Check that picture element is rendered
    const picture = screen.getByRole('img').closest('picture');
    expect(picture).toBeInTheDocument();
    
    // Check for source elements
    const sources = picture?.querySelectorAll('source');
    expect(sources).toHaveLength(2); // AVIF and WebP sources
  });

  it('should handle error state gracefully', async () => {
    const onError = vi.fn();
    
    render(
      <OptimizedImage 
        src="/non-existent.jpg" 
        alt="Test image"
        onError={onError}
        priority={true}
      />
    );
    
    const image = screen.getByAltText('Test image');
    
    // Simulate image error
    act(() => {
      const errorEvent = new Event('error');
      image.dispatchEvent(errorEvent);
    });

    await waitFor(() => {
      expect(screen.getByText('Image non disponible')).toBeInTheDocument();
    });
  });

  it('should lazy load by default when not priority', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image"
        priority={false}
      />
    );
    
    // Should set up intersection observer for lazy loading
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '50px',
      })
    );
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoad = vi.fn();
    
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image"
        onLoad={onLoad}
        priority={true}
      />
    );
    
    const image = screen.getByAltText('Test image');
    
    // Simulate image load
    act(() => {
      const loadEvent = new Event('load');
      image.dispatchEvent(loadEvent);
    });

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className and dimensions', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image"
        className="custom-class"
        width={300}
        height={200}
        priority={true}
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveClass('custom-class');
    expect(image).toHaveAttribute('width', '300');
    expect(image).toHaveAttribute('height', '200');
  });
});

describe('useImagePreloader', () => {
  beforeEach(() => {
    // Clear existing preload links
    document.head.innerHTML = '';
  });

  it('should preload single image', () => {
    const { result } = renderHook(() => useImagePreloader());
    
    act(() => {
      result.current.preloadImage('/test-image.jpg', 'high');
    });
    
    const preloadLinks = document.head.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks).toHaveLength(1);
    
    const link = preloadLinks[0] as HTMLLinkElement;
    expect(link.href).toBe(`${window.location.origin}/test-image.jpg`);
    expect(link.getAttribute('fetchpriority')).toBe('high');
    expect(link.as).toBe('image');
  });

  it('should preload multiple images', () => {
    const { result } = renderHook(() => useImagePreloader());
    
    act(() => {
      result.current.preloadImages([
        { src: '/image1.jpg', priority: 'high' },
        { src: '/image2.jpg', priority: 'low' },
      ]);
    });
    
    const preloadLinks = document.head.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks).toHaveLength(2);
  });

  it('should cleanup preload links after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useImagePreloader());

    act(() => {
      result.current.preloadImage('/test-image.jpg');
    });

  expect(document.head.querySelectorAll('link[rel="preload"]').length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    
  expect(document.head.querySelectorAll('link[rel="preload"]').length).toBe(0);
    vi.useRealTimers();
  });
});