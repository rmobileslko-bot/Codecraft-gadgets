import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').split('-')[0];

  const handleLanguageToggle = (langCode: 'en' | 'hi') => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('preferred_lang', langCode);
      localStorage.setItem('googtrans_lang', langCode); // Keep in sync for compatibility
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
  };

  return (
    <div 
      className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs" 
      id="cc-header-language-toggle"
    >
      <div className="flex items-center pl-1.5 text-slate-400 dark:text-slate-500">
        <Languages className="w-3.5 h-3.5" />
      </div>
      
      <div className="relative flex items-center gap-0.5 font-sans text-xs font-bold">
        {/* English Tab */}
        <button
          onClick={() => handleLanguageToggle('en')}
          className={`relative px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none z-10 ${
            currentLang === 'en'
              ? 'text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {currentLang === 'en' && (
            <motion.div
              layoutId="activeLangHeader"
              className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-lg -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span>EN</span>
        </button>

        {/* Hindi Tab */}
        <button
          onClick={() => handleLanguageToggle('hi')}
          className={`relative px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none z-10 ${
            currentLang === 'hi'
              ? 'text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {currentLang === 'hi' && (
            <motion.div
              layoutId="activeLangHeader"
              className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-lg -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span>हिन्दी</span>
        </button>
      </div>
    </div>
  );
}
