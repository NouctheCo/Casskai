import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OnboardingSuccessMessageProps {
  companyName?: string;
  isVisible: boolean;
}

export const OnboardingSuccessMessage: React.FC<OnboardingSuccessMessageProps> = ({
  companyName,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-3">
              🎉 Configuration terminée !
            </h2>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-4">
              {companyName ? `${companyName} a été configurée avec succès.` : 'Votre entreprise a été configurée avec succès.'}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
              <Sparkles className="w-4 h-4" />
              <span>Redirection vers votre tableau de bord...</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
