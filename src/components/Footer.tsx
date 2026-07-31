import React from 'react';
import { ShieldAlert, Cpu, Heart, CheckCircle2, Mail, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import CodeCraftLogo from './CodeCraftLogo';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = React.useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMsg(t('enterValidEmail', 'Enter a valid email.'));
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      // 1. Save to local server
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      // 2. Save to Firestore if available
      try {
        const { saveNewsletterSubscriptionToFirestore } = await import('../lib/firebase');
        const subscriptionId = `newsletter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await saveNewsletterSubscriptionToFirestore({
          id: subscriptionId,
          email: email.trim().toLowerCase(),
          subscribedAt: new Date().toISOString()
        });
      } catch (fbErr) {
        console.warn('Firestore optional newsletter sync skipped:', fbErr);
      }

      if (res.ok) {
        setStatus('success');
        setMsg(data.message || t('subscribedSuccess', 'Thank you for subscribing!'));
        setEmail('');
      } else {
        setStatus('error');
        setMsg(data.error || t('subscribedFailed', 'Subscription failed.'));
      }
    } catch (err: any) {
      setStatus('error');
      setMsg(t('connectionFailed', 'Connection failed.'));
    }
  };

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 border-t border-slate-800 dark:border-slate-900" id="cc-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top footer row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800 dark:border-slate-900">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <CodeCraftLogo size="lg" variant="full" />
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              codecraft-gadgets is a premier product recommendation engine and price tracker inspired by standard comparison platforms like Buyhatke. We filter out the noise to recommend only top-performing gadgets with zero promotional bias.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Verified affiliate member program.</span>
            </div>
          </div>

          {/* Quick links Categories */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Popular Retailers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://www.amazon.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Amazon India Store
                </a>
              </li>
              <li>
                <a href="https://www.flipkart.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Flipkart Store
                </a>
              </li>
              <li>
                <a href="https://www.apple.com/in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Apple Premium
                </a>
              </li>
              <li>
                <a href="https://www.samsung.com/in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Samsung Store
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Sign Up Box */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{t('weeklyDeals', 'Weekly Price Drops')}</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('newsletterDesc', 'Get notified of massive price drops, real-time discount deals, and curated trending gadgets weekly.')}
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder', 'Enter email address...')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all pr-8"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="absolute right-1 top-1 bottom-1 px-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:bg-slate-700"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {msg && (
                <p className={`text-[10px] font-medium font-mono ${
                  status === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {msg}
                </p>
              )}
            </form>
          </div>

          {/* Affiliate Disclosure box */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Affiliate Disclosure</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When you click on our recommended links to purchase gadgets on Amazon or Flipkart, we may earn a small referral commission at absolutely zero additional cost to you. This support helps us fund our independent, manual spec research and hosting. We maintain absolute objectivity.
            </p>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="text-center md:text-left flex flex-col sm:flex-row items-center gap-4">
            <span>
              &copy; {currentYear} <a href="https://codecrafttechno.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 font-semibold underline">codecraft-gadgets</a>. {t('allRightsReserved', 'All Rights Reserved.')}
            </span>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors cursor-pointer bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl shadow-inner select-none"
                id="cc-footer-admin-btn"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <LanguageSwitcher />
            <div className="hidden sm:block text-slate-800">|</div>
            
            <div className="flex items-center gap-1 text-[11px]">
              <span>{t('poweredBy', 'Powered by')}</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>& {t('engineeredBy', 'engineered by')}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span><a href="https://codecrafttechno.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">Codecrafttechnologies</a>.</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
