import React, { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react';

import { cn } from '../../lib/utils';



export interface SmartTooltipProps {

  children: React.ReactNode;

  content: React.ReactNode;

  side?: 'top' | 'bottom' | 'left' | 'right';

  align?: 'start' | 'center' | 'end';

  delay?: number;

  disabled?: boolean;

  className?: string;

  contentClassName?: string;

  showArrow?: boolean;

  interactive?: boolean;

  trigger?: 'hover' | 'click' | 'focus';

  maxWidth?: number;

  offset?: number;

  animation?: 'fade' | 'scale' | 'shift' | 'bounce';

  theme?: 'dark' | 'light' | 'custom';

  rich?: boolean; // Pour le contenu HTML riche

}



export const SmartTooltip: React.FC<SmartTooltipProps> = ({

  children,

  content,

  side = 'top',

  align = 'center',

  delay = 500,

  disabled = false,

  className,

  contentClassName,

  showArrow = true,

  interactive = false,

  trigger = 'hover',

  maxWidth = 300,

  offset: offsetValue = 8,

  animation = 'fade',

  theme = 'dark',

  rich = false

}) => {

  const [isOpen, setIsOpen] = useState(false);

  const [delayedOpen, setDelayedOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();

  const arrowRef = useRef<HTMLDivElement>(null);



  const { x, y, strategy, refs, context: _context, middlewareData } = useFloating({

    open: isOpen,

    onOpenChange: setIsOpen,

    placement: `${side}-${align}` as any,

    middleware: [

      offset(offsetValue),

      flip(),

      shift(),

      showArrow && arrow({ element: arrowRef })

    ].filter(Boolean),

    whileElementsMounted: autoUpdate

  });



  const showTooltip = () => {

    if (disabled) return;

    

    if (delay > 0) {

      timeoutRef.current = setTimeout(() => {

        setDelayedOpen(true);

      }, delay);

    } else {

      setDelayedOpen(true);

    }

  };



  const hideTooltip = () => {

    if (timeoutRef.current) {

      clearTimeout(timeoutRef.current);

    }

    setDelayedOpen(false);

  };



  const handleMouseEnter = () => {

    if (trigger === 'hover') showTooltip();

  };



  const handleMouseLeave = () => {

    if (trigger === 'hover' && !interactive) hideTooltip();

  };



  const handleClick = () => {

    if (trigger === 'click') {

      if (isOpen) {

        hideTooltip();

      } else {

        showTooltip();

      }

    }

  };



  const handleFocus = () => {

    if (trigger === 'focus') showTooltip();

  };



  const handleBlur = () => {

    if (trigger === 'focus') hideTooltip();

  };



  const handleContentMouseEnter = () => {

    if (interactive && trigger === 'hover') {

      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);

      }

    }

  };



  const handleContentMouseLeave = () => {

    if (interactive && trigger === 'hover') {

      hideTooltip();

    }

  };



  useEffect(() => {

    setIsOpen(delayedOpen);

  }, [delayedOpen]);



  useEffect(() => {

    return () => {

      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);

      }

    };

  }, []);



  const animations = {

    fade: {

      initial: { opacity: 0 },

      animate: { opacity: 1 },

      exit: { opacity: 0 }

    },

    scale: {

      initial: { opacity: 0, scale: 0.8 },

      animate: { opacity: 1, scale: 1 },

      exit: { opacity: 0, scale: 0.8 }

    },

    shift: {

      initial: { opacity: 0, y: side === 'top' ? 10 : side === 'bottom' ? -10 : 0, x: side === 'left' ? 10 : side === 'right' ? -10 : 0 },

      animate: { opacity: 1, y: 0, x: 0 },

      exit: { opacity: 0, y: side === 'top' ? 10 : side === 'bottom' ? -10 : 0, x: side === 'left' ? 10 : side === 'right' ? -10 : 0 }

    },

    bounce: {

      initial: { opacity: 0, scale: 0.3 },

      animate: { opacity: 1, scale: 1 },

      exit: { opacity: 0, scale: 0.8 }

    }

  };



  const themeStyles = {

    dark: 'bg-gray-900 text-white border-gray-700',

    light: 'bg-white text-gray-900 border-gray-200 shadow-lg',

    custom: ''

  };



  const arrowStyles = {

    dark: 'fill-gray-900',

    light: 'fill-white',

    custom: ''

  };



  // Calcul de la position de la flèche

  const arrowX = middlewareData.arrow?.x;

  const arrowY = middlewareData.arrow?.y;



  const getArrowStyles = () => {

    const styles: React.CSSProperties = {};

    

    if (arrowX !== undefined) {

      styles.left = arrowX;

    }

    if (arrowY !== undefined) {

      styles.top = arrowY;

    }



    switch (side) {

      case 'top':

        styles.bottom = -4;

        styles.transform = 'rotate(45deg)';

        break;

      case 'bottom':

        styles.top = -4;

        styles.transform = 'rotate(45deg)';

        break;

      case 'left':

        styles.right = -4;

        styles.transform = 'rotate(45deg)';

        break;

      case 'right':

        styles.left = -4;

        styles.transform = 'rotate(45deg)';

        break;

    }



    return styles;

  };



  return (

    <>

      <div

        ref={refs.setReference}

        onMouseEnter={handleMouseEnter}

        onMouseLeave={handleMouseLeave}

        onClick={handleClick}

        onFocus={handleFocus}

        onBlur={handleBlur}

        className={cn("inline-block", className)}

      >

        {children}

      </div>



      <AnimatePresence>

        {isOpen && (

          <div

            ref={refs.setFloating}

            style={{

              position: strategy,

              top: y ?? 0,

              left: x ?? 0,

              width: 'max-content',

              maxWidth,

              zIndex: 9999

            }}

            onMouseEnter={handleContentMouseEnter}

            onMouseLeave={handleContentMouseLeave}

          >

            <motion.div

              className={cn(

                "px-3 py-2 text-sm rounded-lg border backdrop-blur-sm",

                themeStyles[theme],

                rich && "p-4",

                contentClassName

              )}

              variants={animations[animation]}

              initial="initial"

              animate="animate"

              exit="exit"

              transition={{

                duration: 0.15,

                ease: animation === 'bounce' ? [0.68, -0.55, 0.265, 1.55] : "easeOut"

              }}

            >

              {rich ? (

                <div className="space-y-2">

                  {content}

                </div>

              ) : (

                content

              )}

              

              {showArrow && (

                <div

                  ref={arrowRef}

                  className={cn("absolute w-2 h-2 border", arrowStyles[theme])}

                  style={getArrowStyles()}

                />

              )}

            </motion.div>

          </div>

        )}

      </AnimatePresence>

    </>

  );

};



// Tooltip contextuel avec informations riches

export const RichTooltip: React.FC<{

  children: React.ReactNode;

  title: string;

  description: string;

  actions?: Array<{

    label: string;

    onClick: () => void;

    variant?: 'primary' | 'secondary' | 'danger';

  }>;

  stats?: Array<{

    label: string;

    value: string | number;

    change?: number;

  }>;

  image?: string;

  className?: string;

}> = ({

  children,

  title,

  description,

  actions = [],

  stats = [],

  image,

  className

}) => {

  const content = (

    <div className="space-y-3 min-w-[280px]">

      {image && (

        <motion.img

          src={image}

          alt={title}

          className="w-full h-24 object-cover rounded-md"

          initial={{ opacity: 0, scale: 0.9 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ delay: 0.1 }}

        />

      )}

      

      <div>

        <motion.h4

          className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white"

          initial={{ opacity: 0, y: -10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.1 }}

        >

          {title}

        </motion.h4>

        <motion.p

          className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mt-1"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ delay: 0.2 }}

        >

          {description}

        </motion.p>

      </div>



      {stats.length > 0 && (

        <motion.div

          className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-600 dark:border-gray-600"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.3 }}

        >

          {stats.map((stat, index) => (

            <div key={index} className="text-center">

              <div className="font-semibold text-lg">{stat.value}</div>

              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>

              {stat.change !== undefined && (

                <div className={cn(

                  "text-xs",

                  stat.change >= 0 ? "text-green-600" : "text-red-600"

                )}>

                  {stat.change >= 0 ? '+' : ''}{stat.change}%

                </div>

              )}

            </div>

          ))}

        </motion.div>

      )}



      {actions.length > 0 && (

        <motion.div

          className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600 dark:border-gray-600"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.4 }}

        >

          {actions.map((action, index) => (

            <motion.button

              key={index}

              className={cn(

                "px-3 py-1 text-xs rounded-md font-medium transition-colors",

                action.variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700",

                action.variant === 'danger' && "bg-red-600 text-white hover:bg-red-700",

                (!action.variant || action.variant === 'secondary') && "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"

              )}

              onClick={action.onClick}

              whileHover={{ scale: 1.02 }}

              whileTap={{ scale: 0.98 }}

            >

              {action.label}

            </motion.button>

          ))}

        </motion.div>

      )}

    </div>

  );



  return (

    <SmartTooltip

      content={content}

      rich

      interactive

      delay={300}

      theme="light"

      animation="scale"

      className={className}

    >

      {children}

    </SmartTooltip>

  );

};



// Tooltip avec graphique en temps réel

export const ChartTooltip: React.FC<{

  children: React.ReactNode;

  data: {

    title: string;

    value: number;

    trend: number[];

    color: string;

  };

}> = ({ children, data }) => {

  const maxTrend = Math.max(...data.trend);

  const minTrend = Math.min(...data.trend);

  const range = maxTrend - minTrend;



  const content = (

    <div className="space-y-3 min-w-[200px]">

      <div className="text-center">

        <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">

          {data.title}

        </h4>

        <div className="text-2xl font-bold" style={{ color: data.color }}>

          {data.value.toLocaleString()}

        </div>

      </div>



      <div className="h-16 flex items-end space-x-1">

        {data.trend.map((value, index) => {

          const height = range > 0 ? ((value - minTrend) / range) * 100 : 50;

          return (

            <motion.div

              key={index}

              className="flex-1 rounded-t-sm"

              style={{

                backgroundColor: data.color,

                height: `${Math.max(height, 5)}%`,

                minHeight: '2px',

                transformOrigin: "bottom"

              }}

              initial={{ scaleY: 0 }}

              animate={{ scaleY: 1 }}

              transition={{

                delay: index * 0.05,

                duration: 0.4,

                ease: "easeOut"

              }}

            />

          );

        })}

      </div>

    </div>

  );



  return (

    <SmartTooltip

      content={content}

      rich

      delay={200}

      theme="light"

      animation="scale"

    >

      {children}

    </SmartTooltip>

  );

};
