// Configuration globale des animations pour optimiser les performances
export const ANIMATION_CONFIG = {
  // Durées optimisées pour maintenir 60fps
  durations: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8
  },
  
  // Easings optimisés pour des transitions fluides
  easings: {
    spring: [0.23, 1, 0.32, 1],
    ease: [0.4, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeOut: [0.0, 0.0, 0.2, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    anticipate: [0.0, 0.0, 0.2, 1]
  },
  
  // Stagger delays pour les animations en série
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15
  },
  
  // Propriétés CSS performantes (évitent le repaint/reflow)
  performantProperties: [
    'transform',
    'opacity',
    'filter',
    'backdrop-filter'
  ],
  
  // Propriétés à éviter (causent repaint/reflow)
  expensiveProperties: [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'border'
  ]
};

// Variants d'animation optimisés
export const OPTIMIZED_VARIANTS = {
  // Fade in/out optimisé
  fade: {
    initial: { 
      opacity: 0,
      // Utilise will-change pour optimiser les performances
      willChange: 'opacity'
    },
    animate: { 
      opacity: 1,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast,
        ease: ANIMATION_CONFIG.easings.ease
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Scale optimisé pour les boutons et cartes
  scale: {
    initial: { 
      scale: 0.9,
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      scale: 0.95,
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Slide optimisé pour les pages
  slideUp: {
    initial: { 
      y: 20,
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      y: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_CONFIG.durations.normal,
        ease: ANIMATION_CONFIG.easings.ease
      }
    },
    exit: { 
      y: -20,
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Container pour staggering
  container: {
    animate: {
      transition: {
        staggerChildren: ANIMATION_CONFIG.stagger.normal,
        delayChildren: 0.1
      }
    }
  },

  // Item pour staggering
  item: {
    initial: { 
      y: 20, 
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }
};
