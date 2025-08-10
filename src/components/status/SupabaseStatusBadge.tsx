import { useState } from 'react';
import { CheckCircle2, CircleDashed, CircleAlert, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { testSupabaseConnection } from '@/utils/testConnection';

type Status = 'idle' | 'checking' | 'ok' | 'warn' | 'error';

export function SupabaseStatusBadge() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('Cliquer pour vérifier le statut Supabase');

  const color =
    status === 'ok' ? 'text-emerald-500' :
    status === 'warn' ? 'text-amber-500' :
    status === 'error' ? 'text-red-500' :
    'text-gray-400';

  const Icon =
    status === 'ok' ? CheckCircle2 :
    status === 'error' ? CircleAlert :
    status === 'checking' ? CircleDashed :
    Shield;

  const handleCheck = async () => {
    try {
      setStatus('checking');
      setMessage('Vérification en cours…');
      const res = await testSupabaseConnection();
      if (res.success) {
        if ((res as any).authStatus && (res as any).authStatus !== 'authenticated') {
          setStatus('warn');
          setMessage('Connecté à Supabase, utilisateur non authentifié');
        } else {
          setStatus('ok');
          setMessage('Supabase opérationnel');
        }
      } else {
        setStatus('error');
        setMessage(res.error || 'Erreur de connexion Supabase');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Erreur inattendue lors du check');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 dark:border-gray-800/20 bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
            aria-label="Statut Supabase"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="hidden md:inline text-xs text-gray-700 dark:text-gray-200">Supabase</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">{message}</div>
          <div className="text-[10px] text-gray-500 mt-1">Cliquer pour actualiser</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SupabaseStatusBadge;
