import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ThirdPartyForm({ isOpen, onClose, thirdParty, onSubmit }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Formulaire Tiers</DialogTitle>
          <DialogDescription>
            Cette fonctionnalité est en cours de développement
          </DialogDescription>
        </DialogHeader>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-4">
            Bientôt disponible dans une prochaine version
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
