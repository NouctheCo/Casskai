import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnimatedChartProps {
  type: 'bar' | 'line' | 'doughnut' | 'pie';
  data: any;
  options?: any;
  className?: string;
  animateOnView?: boolean;
  animationDelay?: number;
  staggerDelay?: number;
}

// Configuration d'animation personnalisée pour Chart.js
const createAnimatedOptions = (delay: number = 0, stagger: number = 100) => ({
  animation: {
    delay,
    duration: 1500,
    easing: 'easeOutQuart',
    onComplete: () => {
      // Animation terminée
    },
    onProgress: (context: any) => {
      // Progression de l'animation
      const progress = context.currentStep / context.numSteps;
      return progress;
    }
  },
  animations: {
    y: {
      from: 500,
      duration: 1000,
      delay: (context: any) => context.dataIndex * stagger + delay
    },
    x: {
      from: -100,
      duration: 800,
      delay: (context: any) => context.dataIndex * stagger + delay
    }
  },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      animation: {
        duration: 200
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(0, 0, 0, 0.6)'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: 'rgba(0, 0, 0, 0.6)'
      }
    }
  }
});

export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  type,
  data,
  options = {},
  className,
  animateOnView = true,
  animationDelay = 0,
  staggerDelay = 100
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [shouldAnimate, setShouldAnimate] = useState(!animateOnView);

  useEffect(() => {
    if (animateOnView && isInView) {
      setShouldAnimate(true);
    }
  }, [isInView, animateOnView]);

  const chartOptions = {
    ...createAnimatedOptions(animationDelay, staggerDelay),
    ...options
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    doughnut: Doughnut,
    pie: Pie
  }[type];

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: animationDelay / 1000,
        ease: "easeOut"
      }}
    >
      {shouldAnimate && (
        <ChartComponent data={data} options={chartOptions} />
      )}
    </motion.div>
  );
};

// Chart avec overlay d'animation personnalisé
export const AnimatedBarChart: React.FC<{
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  className?: string;
  showAnimation?: boolean;
}> = ({ data, className, showAnimation = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [animatedData, setAnimatedData] = useState(data);

  useEffect(() => {
    if (showAnimation && isInView) {
      // Animation séquentielle des barres
      const animateSequentially = async () => {
        const datasets = data.datasets.map(dataset => ({
          ...dataset,
          data: new Array(dataset.data.length).fill(0)
        }));

        setAnimatedData({ ...data, datasets });

        for (let i = 0; i < data.labels.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          setAnimatedData(prev => ({
            ...prev,
            datasets: prev.datasets.map((dataset, datasetIndex) => ({
              ...dataset,
              data: dataset.data.map((value, index) => 
                index <= i ? data.datasets[datasetIndex].data[index] : 0
              )
            }))
          }));
        }
      };

      animateSequentially();
    }
  }, [isInView, data, showAnimation]);

  return (
    <div ref={ref} className={className}>
      <AnimatedChart
        type="bar"
        data={animatedData}
        animateOnView={false}
        options={{
          animation: {
            duration: 300,
            easing: 'easeOutQuart'
          }
        }}
      />
    </div>
  );
};

// Chart avec animations de valeurs en temps réel
export const LiveChart: React.FC<{
  initialData: any;
  updateInterval?: number;
  maxDataPoints?: number;
  className?: string;
  onDataUpdate?: (data: any) => any;
}> = ({
  initialData,
  updateInterval = 2000,
  maxDataPoints = 10,
  className,
  onDataUpdate
}) => {
  const [chartData, setChartData] = useState(initialData);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!isLive || !onDataUpdate) return;

    const interval = setInterval(() => {
      setChartData((prev: any) => {
        const newData = onDataUpdate(prev);
        
        // Limiter le nombre de points de données
        if (newData.labels.length > maxDataPoints) {
          newData.labels = newData.labels.slice(-maxDataPoints);
          newData.datasets = newData.datasets.map((dataset: any) => ({
            ...dataset,
            data: dataset.data.slice(-maxDataPoints)
          }));
        }

        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, updateInterval, maxDataPoints, onDataUpdate]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-4 right-4 z-10">
        <motion.button
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all",
            isLive 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-gray-100 text-gray-800 border border-gray-200"
          )}
          onClick={() => setIsLive(!isLive)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="flex items-center space-x-1"
            animate={isLive ? { opacity: [1, 0.5, 1] } : {}}
            transition={isLive ? { repeat: Infinity, duration: 1.5 } : {}}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-green-500" : "bg-gray-400"
            )} />
            <span>{isLive ? 'Live' : 'Stopped'}</span>
          </motion.div>
        </motion.button>
      </div>
      
      <AnimatedChart
        type="line"
        data={chartData}
        animateOnView={false}
        options={{
          animation: {
            duration: 500,
            easing: 'easeOutQuart'
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }}
      />
    </div>
  );
};

// Wrapper pour Chart.js avec animations personnalisées
export const EnhancedChart: React.FC<{
  type: 'bar' | 'line' | 'doughnut' | 'pie';
  data: any;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  showTooltips?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  onChartClick?: (event: any, elements: any[]) => void;
}> = ({
  type,
  data,
  title,
  subtitle,
  showLegend = true,
  showTooltips = true,
  theme = 'light',
  className,
  onChartClick
}) => {
  const chartRef = useRef<any>(null);

  const themeOptions = theme === 'dark' ? {
    color: 'white',
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  } : {};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend
      },
      tooltip: {
        enabled: showTooltips
      },
      title: title ? {
        display: true,
        text: title,
        color: theme === 'dark' ? 'white' : 'black',
        font: {
          size: 16,
          weight: 'bold'
        }
      } : undefined
    },
    onClick: onChartClick,
    ...themeOptions
  };

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {(title || subtitle) && (
        <div className="text-center">
          {title && (
            <motion.h3
              className="text-lg font-semibold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p
              className="text-sm text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}
      
      <div className="relative h-64 md:h-80">
        <AnimatedChart
          ref={chartRef}
          type={type}
          data={data}
          options={options}
          animationDelay={300}
          staggerDelay={150}
        />
      </div>
    </motion.div>
  );
};