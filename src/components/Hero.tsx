import React from 'react';
import { Sparkles, ShieldCheck, TrendingUp, Zap, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import CodeCraftLogo from './CodeCraftLogo';

interface HeroProps {
  onOpenQuiz: () => void;
  setSearchQuery: (query: string) => void;
}

export default function Hero({ onOpenQuiz, setSearchQuery }: HeroProps) {
  const trendingSearches = ['iPhone 15 Pro', 'M3 MacBook', 'RTX 4060', 'Sony ANC'];
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-900/60 py-12 md:py-20 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300" id="cc-hero-section">
      {/* Background blobs for subtle depth */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full blur-3xl opacity-60 -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-slate-50 dark:bg-slate-950/20 rounded-full blur-3xl opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl sm:rounded-full text-indigo-700 dark:text-indigo-400 text-xs font-semibold max-w-full text-left">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500 shrink-0" />
              <span className="leading-normal sm:leading-none">{t('heroBadge', '100% Unbiased Expert Reviews & Price Comparison')}</span>
            </div>
 
            {/* Display Header */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {t('heroHeading', 'Find the Absolute Best Gadget Price & Expert Reviews')}
            </h1>

            {/* Descriptive sub-header */}
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t('heroSubheading', 'We compare top retailers, track historic prices, and provide direct pros & cons so you make the perfect buying choice.')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenQuiz}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 cursor-pointer"
              >
                <HelpCircle className="w-5 h-5 text-indigo-200" />
                <span>{t('findMatchBtn', 'Find My Perfect Match')}</span>
              </motion.button>

              <button
                onClick={() => {
                  const el = document.getElementById('gadget-showcase');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>{t('exploreBtn', 'Explore Top Products')}</span>
              </button>
            </div>

            {/* Popular/Trending searches */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-4">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('trending', 'TRENDING')}:</span>
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

          </div>

          {/* Graphical Trust Widget */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[420px] bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none">
              
              <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800 pb-4 mb-4">
                <CodeCraftLogo size="md" variant="icon-only" />
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 leading-tight text-xs sm:text-sm">CodeCraft Technologies Seal</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Zero Sponsored Placements</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 dark:bg-indigo-950/60 p-1 rounded text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">6-Month Price Logs</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">Inspired by Buyhatke, each card provides a complete 6-month visual chart showing when to wait vs buy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-amber-100 dark:bg-amber-950/60 p-1 rounded text-amber-600 dark:text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Real-Time Coupon Codes</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">Integrated code copy elements for extra checkout discounts on major retailers.</p>
                  </div>
                </div>
              </div>

              {/* Trust Badge statistics row */}
              <div className="grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-slate-200/50 dark:border-slate-800 text-center">
                <div>
                  <span className="block font-display font-extrabold text-lg text-slate-800 dark:text-slate-200">4.8★</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">Avg Expert Rating</span>
                </div>
                <div className="border-x border-slate-200/50 dark:border-slate-800">
                  <span className="block font-display font-extrabold text-lg text-slate-800 dark:text-slate-200">100%</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">No Sponsored Bias</span>
                </div>
                <div>
                  <span className="block font-display font-extrabold text-lg text-slate-800 dark:text-slate-200">9+</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">Top Gadgets</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
