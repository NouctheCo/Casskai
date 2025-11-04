import React from 'react';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface EmailConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResendEmail?: () => void;
  isResending?: boolean;
}

export const EmailConfirmationDialog: React.FC<EmailConfirmationDialogProps> = ({
  isOpen,
  onClose,
  email,
  onResendEmail,
  isResending = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-6">
          <motion.div 
            className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Vérifiez votre adresse email
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              Nous avons envoyé un email de confirmation à :
            </p>
            <p className="font-medium text-blue-600 dark:text-blue-400 break-all">
              {email}
            </p>
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Instructions importantes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-2">Instructions importantes :</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-amber-600 dark:text-amber-400" />
                    Cliquez sur le lien dans l'email pour confirmer votre compte
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-amber-600 dark:text-amber-400" />
                    Vérifiez votre dossier spam/courrier indésirable
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-amber-600 dark:text-amber-400" />
                    Le lien expire dans 24 heures
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`mailto:`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir ma boîte mail
            </Button>

            {onResendEmail && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onResendEmail}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renvoyer
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Note en bas */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vous pourrez vous connecter après avoir confirmé votre email
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onClose}
            >
              Je comprends
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
