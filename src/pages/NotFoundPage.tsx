import React from 'react';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { AlertTriangle } from 'lucide-react';
    import { useLocale } from '@/contexts/LocaleContext';
    import { motion } from 'framer-motion';

    export default function NotFoundPage() {
      const { t } = useLocale();
      return (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
        >
          <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <p className="text-2xl text-muted-foreground mb-8">{t('pageNotFound')}</p>
          <motion.div
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white">
              <Link to="/">{t('goHome')}</Link>
            </Button>
          </motion.div>
        </motion.div>
      );
    }
