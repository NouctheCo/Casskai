import React from 'react';
import { MotionConfig } from 'framer-motion';
import { useAdaptiveAnimations } from './hooks';

// Composant wrapper pour optimiser les animations
export const OptimizedMotion: React.FC<{
  children: React.ReactNode;
  reducedMotion?: boolean;
}> = ({ children, reducedMotion = false }) => {
  const adaptive = useAdaptiveAnimations();
  
  return (
    <MotionConfig
      transition={{
        duration: adaptive.duration,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      reducedMotion={reducedMotion ? "always" : adaptive.enabled ? "never" : "user"}
    >
      {children}
    </MotionConfig>
  );
};

// Composant de monitoring des performances d'animation
export const AnimationPerformanceMonitor: React.FC<{
  enabled?: boolean;
  onPerformanceIssue?: (data: { fps: number; timestamp: number; type: string }) => void;
}> = ({ enabled = process.env.NODE_ENV === 'development', onPerformanceIssue }) => {
  React.useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Alerte si FPS trop faible
        if (fps < 50 && onPerformanceIssue) {
          onPerformanceIssue({
            fps,
            timestamp: currentTime,
            type: 'low-fps'
          });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }, [enabled, onPerformanceIssue]);

  return null;
};
