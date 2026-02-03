import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Mail } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ScheduleReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (config: ScheduleConfig) => void;
}

export interface ScheduleConfig {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  email: string;
  format: 'pdf' | 'excel' | 'csv';
  includeComparison: boolean;
}

export function ScheduleReportModal({
  open,
  onOpenChange,
  onSchedule
}: ScheduleReportModalProps) {
  const [reportType, setReportType] = useState('balance_sheet');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [time, setTime] = useState('09:00');
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeComparison, setIncludeComparison] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!email) {
      logger.warn('ScheduleReportModal', 'Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const config: ScheduleConfig = {
        reportType,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' || frequency === 'quarterly' ? parseInt(dayOfMonth) : undefined,
        time,
        email,
        format,
        includeComparison
      };

      logger.debug('ScheduleReportModal', '📅 Scheduling report:', config);
      onSchedule(config);
      
      // Reset form
      setReportType('balance_sheet');
      setFrequency('monthly');
      setDayOfWeek('monday');
      setDayOfMonth('1');
      setTime('09:00');
      setEmail('');
      setFormat('pdf');
      setIncludeComparison(true);
    } catch (error) {
      logger.error('ScheduleReportModal', 'Error scheduling report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                Programmer un rapport
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Configurez la génération automatique de rapports à intervalles réguliers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-6">
              {/* Report Type */}
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-2">Type de rapport</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance_sheet">Bilan comptable</SelectItem>
                    <SelectItem value="income_statement">Compte de résultat</SelectItem>
                    <SelectItem value="trial_balance">Balance générale</SelectItem>
                    <SelectItem value="general_ledger">Grand livre</SelectItem>
                    <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
                    <SelectItem value="financial_ratios">Ratios financiers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-2">Fréquence</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day Selection */}
              {frequency === 'weekly' && (
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-2">Jour de la semaine</label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Lundi</SelectItem>
                      <SelectItem value="tuesday">Mardi</SelectItem>
                      <SelectItem value="wednesday">Mercredi</SelectItem>
                      <SelectItem value="thursday">Jeudi</SelectItem>
                      <SelectItem value="friday">Vendredi</SelectItem>
                      <SelectItem value="saturday">Samedi</SelectItem>
                      <SelectItem value="sunday">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(frequency === 'monthly' || frequency === 'quarterly') && (
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-2">Jour du mois</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
              )}

              {/* Time */}
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Heure de génération
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  Email de destination
                </label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Format */}
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-2">Format de fichier</label>
                <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Comparison */}
              <div className="flex items-center space-x-3 py-2">
                <Checkbox
                  id="comparison"
                  checked={includeComparison}
                  onCheckedChange={(checked) => setIncludeComparison(checked === true)}
                />
                <label htmlFor="comparison" className="text-xs sm:text-sm font-medium cursor-pointer">
                  Inclure la comparaison avec la période précédente
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-4 sm:px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs sm:text-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isSubmitting || !email}
              className="text-xs sm:text-sm"
            >
              {isSubmitting ? 'Programmation...' : 'Programmer'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
