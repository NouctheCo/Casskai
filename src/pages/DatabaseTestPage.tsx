import React from 'react';
import DatabaseTest from '../components/test/DatabaseTest';
import { motion } from 'framer-motion';
import { ArrowLeft, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function DatabaseTestPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/settings')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tests Base de Données
            </h1>
            <Database className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Testez la connectivité et l'intégrité de votre base de données Supabase
          </p>
        </div>
      </motion.div>

      {/* Test Component */}
      <motion.div variants={itemVariants}>
        <DatabaseTest />
      </motion.div>
    </motion.div>
  );
}