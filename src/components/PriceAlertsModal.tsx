import React from 'react';
import { X, BellOff, BellRing, ShieldCheck, Mail, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { PriceAlert } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface PriceAlertsModalProps {
  alerts: PriceAlert[];
  onRemoveAlert: (id: string) => void;
  onClose: () => void;
}

export default function PriceAlertsModal({ alerts, onRemoveAlert, onClose }: PriceAlertsModalProps) {
  const { t } = useTranslation();
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(p);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-bounce-slow" />
            <span className="font-display font-bold text-slate-900 dark:text-slate-100">
              {t('trackedPriceAlerts', 'Tracked Price Alerts')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('alertDescText', "Whenever a retail price on Amazon India falls below your chosen target threshold, our scraper triggers an instant email dispatch notification.")}
          </p>

          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
                  <BellOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('noActiveAlerts', 'No active alerts set')}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t('noActiveAlertsDesc', 'Click "Price History" on any gadget card to set a trigger.')}</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/80 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={alert.productName}>
                        {alert.productName}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.25 rounded font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                          Amazon
                        </span>
                        
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t('targetPriceLabel', 'Target')}: {formatPrice(alert.targetPrice)}</span>
                      </div>

                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{alert.email}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveAlert(alert.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 px-2.5 py-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      {t('removeBtn', 'Remove')}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t('alertPrivacyNote', 'We never sell your email or spam you. Data is stored purely inside session parameters.')}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t('doneBtn', 'Done')}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
