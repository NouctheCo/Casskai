// @ts-nocheck
import React, { Suspense } from 'react';
import { componentStrategies } from '@/utils/performance/lazyLoading';
import { Skeleton } from './skeleton';

// Lazy-loaded chart component to avoid loading heavy chart.js upfront
const LazyAnimatedChart = componentStrategies.visualization(() => import('./AnimatedChart'));

interface LazyChartProps {
  type: 'bar' | 'line' | 'doughnut' | 'pie';
  data: any;
  options?: any;
  className?: string;
  animateOnView?: boolean;
  animationDelay?: number;
  staggerDelay?: number;
}

const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={className}>
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="mt-4 flex justify-center space-x-4">
      <Skeleton className="h-4 w-16 rounded" />
      <Skeleton className="h-4 w-20 rounded" />
      <Skeleton className="h-4 w-14 rounded" />
    </div>
  </div>
);

export const LazyChart: React.FC<LazyChartProps> = (props) => {
  return (
    <Suspense fallback={<ChartSkeleton className={props.className} />}>
      <LazyAnimatedChart {...props} />
    </Suspense>
  );
};

export default LazyChart;