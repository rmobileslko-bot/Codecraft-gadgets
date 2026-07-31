import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = (i18n.language || 'en').split('-')[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('preferred_lang', langCode);
      localStorage.setItem('googtrans_lang', langCode);
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === selectedLang) || languages[0];

  return (
    <div className="relative inline-block text-left notranslate" ref={dropdownRef} id="cc-language-switcher" translate="no">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full sm:rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-sm select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-mono hidden sm:inline text-xs">{currentLanguage.native}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 hidden sm:inline ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile-only Background Overlay with high z-index */}
            <div 
              className="sm:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99998]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:bottom-full sm:mb-3 w-full sm:w-56 rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl z-[99999] overflow-hidden notranslate"
              translate="no"
            >
              {/* FIXED HEADER (Never scrolls out of view) */}
              <div className="px-4 py-3 sm:px-3.5 sm:py-2.5 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  Select Language
                </span>
                {/* Close button for mobile to finalize action */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Done
                </button>
              </div>

              {/* SCROLLABLE LANGUAGE LIST */}
              <div className="py-1 max-h-[50vh] sm:max-h-64 overflow-y-auto">
                <div className="p-2 sm:p-1 space-y-0.5">
                  {languages.map((lang) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center justify-between px-4 py-3 sm:px-3 sm:py-2 rounded-2xl sm:rounded-xl text-left transition-all group cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate leading-tight">
                            {lang.native}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-1 sm:mt-0.5 group-hover:text-indigo-500/80 dark:group-hover:text-indigo-400/80 font-normal">
                            {lang.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
