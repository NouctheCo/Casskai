/**
 * CassKai Landing V2 - Timeline de Transformation
 * Comparaison Avant/Après avec défilement automatique
 */

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, AlertTriangle, CheckCircle, XCircle, TrendingUp, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface TimelineItem {
  day: string;
  before: {
    title: string;
    description: string;
    icon: React.ReactNode;
    time?: string;
    status: 'bad' | 'warning' | 'neutral';
  };
  after: {
    title: string;
    description: string;
    icon: React.ReactNode;
    time?: string;
    status: 'good' | 'excellent';
  };
}


function TimelineCard({ item, side }: { item: TimelineItem['before'] | TimelineItem['after']; side: 'before' | 'after' }) {
  const statusColors = {
    bad: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    neutral: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    good: 'bg-green-500/10 border-green-500/30 text-green-400',
    excellent: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };

  const iconColors = {
    bad: 'text-red-400',
    warning: 'text-amber-400',
    neutral: 'text-slate-400',
    good: 'text-green-400',
    excellent: 'text-emerald-400',
  };

  return (
    <div className={`p-5 rounded-xl border ${statusColors[item.status]} backdrop-blur-sm h-full`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-slate-800/50 ${iconColors[item.status]}`}>
          {item.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white text-lg">{item.title}</h4>
          {item.time && (
            <span className={`text-sm font-medium ${iconColors[item.status]}`}>
              {item.time}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-400">{item.description}</p>
    </div>
  );
}

export function TransformationTimeline() {
  const { t } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const TIMELINE_DATA: TimelineItem[] = [
    {
      day: t('landing.timeline.items.0.day'),
      before: {
        title: t('landing.timeline.items.0.before.title'),
        description: t('landing.timeline.items.0.before.description'),
        icon: <Clock className="w-6 h-6" />,
        time: t('landing.timeline.items.0.before.time'),
        status: 'bad',
      },
      after: {
        title: t('landing.timeline.items.0.after.title'),
        description: t('landing.timeline.items.0.after.description'),
        icon: <Zap className="w-6 h-6" />,
        time: t('landing.timeline.items.0.after.time'),
        status: 'excellent',
      },
    },
    {
      day: t('landing.timeline.items.1.day'),
      before: {
        title: t('landing.timeline.items.1.before.title'),
        description: t('landing.timeline.items.1.before.description'),
        icon: <AlertTriangle className="w-6 h-6" />,
        time: t('landing.timeline.items.1.before.time'),
        status: 'warning',
      },
      after: {
        title: t('landing.timeline.items.1.after.title'),
        description: t('landing.timeline.items.1.after.description'),
        icon: <CheckCircle className="w-6 h-6" />,
        time: t('landing.timeline.items.1.after.time'),
        status: 'excellent',
      },
    },
    {
      day: t('landing.timeline.items.2.day'),
      before: {
        title: t('landing.timeline.items.2.before.title'),
        description: t('landing.timeline.items.2.before.description'),
        icon: <XCircle className="w-6 h-6" />,
        time: t('landing.timeline.items.2.before.time'),
        status: 'bad',
      },
      after: {
        title: t('landing.timeline.items.2.after.title'),
        description: t('landing.timeline.items.2.after.description'),
        icon: <CheckCircle className="w-6 h-6" />,
        time: t('landing.timeline.items.2.after.time'),
        status: 'excellent',
      },
    },
    {
      day: t('landing.timeline.items.3.day'),
      before: {
        title: t('landing.timeline.items.3.before.title'),
        description: t('landing.timeline.items.3.before.description'),
        icon: <Clock className="w-6 h-6" />,
        time: t('landing.timeline.items.3.before.time'),
        status: 'warning',
      },
      after: {
        title: t('landing.timeline.items.3.after.title'),
        description: t('landing.timeline.items.3.after.description'),
        icon: <TrendingUp className="w-6 h-6" />,
        time: t('landing.timeline.items.3.after.time'),
        status: 'good',
      },
    },
    {
      day: t('landing.timeline.items.4.day'),
      before: {
        title: t('landing.timeline.items.4.before.title'),
        description: t('landing.timeline.items.4.before.description'),
        icon: <AlertTriangle className="w-6 h-6" />,
        time: t('landing.timeline.items.4.before.time'),
        status: 'bad',
      },
      after: {
        title: t('landing.timeline.items.4.after.title'),
        description: t('landing.timeline.items.4.after.description'),
        icon: <CheckCircle className="w-6 h-6" />,
        time: t('landing.timeline.items.4.after.time'),
        status: 'excellent',
      },
    },
  ];

  // Auto-play: change d'étape toutes les 4 secondes
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TIMELINE_DATA.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + TIMELINE_DATA.length) % TIMELINE_DATA.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % TIMELINE_DATA.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const currentItem = TIMELINE_DATA[activeIndex];

  return (
    <section ref={containerRef} className="relative py-24 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/10 to-green-500/10 border border-slate-700 mb-6">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-slate-400">{t('landing.timeline.before')}</span>
            <span className="text-slate-600 mx-2">→</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">{t('landing.timeline.after')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('landing.timeline.title')}{' '}
            <span className="bg-gradient-to-r from-red-400 via-amber-400 to-green-400 bg-clip-text text-transparent">
              {t('landing.timeline.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('landing.timeline.description')}
          </p>
        </motion.div>

        {/* Timeline Navigation Pills */}
        <div className="flex justify-center gap-2 mb-8">
          {TIMELINE_DATA.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setActiveIndex(index);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                index === activeIndex
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {item.day}
            </button>
          ))}
        </div>

        {/* Main Timeline Display */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Controls */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-10">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label={t('landing.timeline.previous')}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-10">
            <button
              type="button"
              onClick={goToNext}
              aria-label={t('landing.timeline.next')}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Timeline Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="px-8"
            >
              {/* Day Label */}
              <div className="text-center mb-8">
                <span className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white font-bold text-xl">
                  {currentItem.day}
                </span>
              </div>

              {/* Before/After Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-red-400 font-semibold">{t('landing.timeline.beforeCasskai')}</span>
                  </div>
                  <TimelineCard item={currentItem.before} side="before" />
                </div>

                {/* Arrow for desktop */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-green-500 flex items-center justify-center shadow-lg"
                  >
                    <span className="text-white text-2xl">→</span>
                  </motion.div>
                </div>

                {/* After */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-green-400 font-semibold">{t('landing.timeline.withCasskai')}</span>
                  </div>
                  <TimelineCard item={currentItem.after} side="after" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Auto-play controls */}
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={toggleAutoPlay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-sm"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  {t('landing.timeline.pause')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t('landing.timeline.play')}
                </>
              )}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {TIMELINE_DATA.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                    : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '90%', label: t('landing.timeline.stats.timeSaved'), color: 'from-green-400 to-emerald-400' },
            { value: '0', label: t('landing.timeline.stats.errors'), color: 'from-blue-400 to-cyan-400' },
            { value: '100%', label: t('landing.timeline.stats.compliance'), color: 'from-purple-400 to-pink-400' },
            { value: '24/7', label: t('landing.timeline.stats.access'), color: 'from-amber-400 to-orange-400' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50"
            >
              <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TransformationTimeline;
