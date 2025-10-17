import { useState } from 'react';
import { MessageSquare, X, ThumbsUp, ThumbsDown, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface FeedbackWidgetProps {
  className?: string;
}

type FeedbackType = 'positive' | 'negative' | 'bug' | 'suggestion';

export function FeedbackWidget({ className }: FeedbackWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show in staging environment
  const isStaging = import.meta.env.VITE_APP_ENV === 'staging' ||
                     import.meta.env.VITE_BETA_FEEDBACK_ENABLED === 'true';

  if (!isStaging) {
    return null;
  }

  const handleSubmit = async () => {
    if (!message.trim() || !feedbackType) {
      toast.error('Veuillez sélectionner un type et écrire un message');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: user?.id,
          feedback_type: feedbackType,
          message: message.trim(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Merci pour votre feedback! 🙏');
      setMessage('');
      setFeedbackType(null);
      setIsOpen(false);
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      toast.error('Erreur lors de l\'envoi du feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full shadow-lg',
          'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          'text-white font-semibold px-6 py-6',
          'animate-pulse hover:animate-none',
          'transition-all duration-300',
          className
        )}
        title="Donnez votre avis Beta"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="ml-2 hidden md:inline">Feedback Beta</span>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
        'w-96 max-w-[calc(100vw-3rem)]',
        'border border-gray-200 dark:border-gray-700',
        'overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Feedback Beta</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setFeedbackType(null);
            setMessage('');
          }}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Feedback Type Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Type de feedback
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={feedbackType === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('positive')}
              className={cn(
                'flex items-center gap-2',
                feedbackType === 'positive' && 'bg-green-600 hover:bg-green-700'
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Positif</span>
            </Button>
            <Button
              variant={feedbackType === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('negative')}
              className={cn(
                'flex items-center gap-2',
                feedbackType === 'negative' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Négatif</span>
            </Button>
            <Button
              variant={feedbackType === 'bug' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('bug')}
              className={cn(
                'flex items-center gap-2',
                feedbackType === 'bug' && 'bg-orange-600 hover:bg-orange-700'
              )}
            >
              <Bug className="h-4 w-4" />
              <span>Bug</span>
            </Button>
            <Button
              variant={feedbackType === 'suggestion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('suggestion')}
              className={cn(
                'flex items-center gap-2',
                feedbackType === 'suggestion' && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Suggestion</span>
            </Button>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Votre message
          </label>
          <Textarea
            placeholder="Partagez votre expérience, signalez un bug, ou suggérez une amélioration..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!feedbackType || !message.trim() || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer le feedback'}
        </Button>

        {/* Footer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Merci de participer à la phase Beta! 🚀
        </p>
      </div>
    </div>
  );
}
