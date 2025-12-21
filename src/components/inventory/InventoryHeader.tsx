import { FC } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, MinusCircle, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type InventoryHeaderProps = {
  title: string;
  description: string;
  badgeLabel: string;
  newArticleLabel: string;
  newMovementLabel: string;
  onNewArticle: () => void;
  onNewMovement: () => void;
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const InventoryHeader: FC<InventoryHeaderProps> = ({
  title,
  description,
  badgeLabel,
  newArticleLabel,
  newMovementLabel,
  onNewArticle,
  onNewMovement
}) => (
  <motion.div
    className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
    initial="hidden"
    animate="visible"
    variants={containerVariants}
  >
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">{title}</h1>
        <Sparkles className="h-6 w-6 text-yellow-500" />
      </div>
      <div className="flex items-center space-x-2">
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
        <Badge variant="secondary" className="text-xs">
          {badgeLabel}
        </Badge>
      </div>
    </div>

    <div className="flex items-center space-x-3">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant="outline" onClick={onNewArticle}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {newArticleLabel}
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={onNewMovement}
        >
          <MinusCircle className="mr-2 h-4 w-4" />
          {newMovementLabel}
        </Button>
      </motion.div>
    </div>
  </motion.div>
);

export default InventoryHeader;
