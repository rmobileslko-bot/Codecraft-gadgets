import React, { useState } from 'react';
import { Smartphone, Laptop, Headphones, Watch, Keyboard, Sparkles, Menu, X, Bell, Award, ArrowUpRight, Sun, Moon, ShieldAlert, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import CodeCraftLogo from './CodeCraftLogo';

interface HeaderProps {
  activeCategory: string;
  setActiveCategory: (category: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAlerts: () => void;
  activeAlertsCount: number;
  onOpenQuiz: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenAdmin?: () => void;
  products?: any[];
  onSelectProduct?: (productId: string) => void;
}

export default function Header({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onOpenAlerts,
  activeAlertsCount,
  onOpenQuiz,
  darkMode,
  setDarkMode,
  onOpenAdmin,
  products = [],
  onSelectProduct
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const { t } = useTranslation();

  // Filter products for autocomplete suggestions
  const suggestions = React.useMemo(() => {
    if (!products || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [products, searchQuery]);

  const handleSelectSuggestion = (productId: string, name: string) => {
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      setSearchQuery(name);
    }
    setIsFocused(false);
    setIsMobileFocused(false);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'all', label: t('allCategories', 'All'), icon: Sparkles },
    { id: 'news', label: t('latestNews', 'Latest News'), icon: Newspaper, isSpecial: true },
    { id: 'smartphones', label: t('smartphones', 'Mobiles'), icon: Smartphone },
    { id: 'laptops', label: t('laptops', 'Laptops'), icon: Laptop },
    { id: 'audio', label: t('audio', 'Audio'), icon: Headphones },
    { id: 'wearables', label: t('wearables', 'Wearables'), icon: Watch },
    { id: 'accessories', label: t('accessories', 'Gears'), icon: Keyboard }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm w-full transition-colors duration-300" id="cc-main-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-2">
          
          {/* Logo */}
          <div 
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 group"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CodeCraftLogo size="md" variant="full" />
            </motion.div>
            <a 
              href="https://codecrafttechno.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="hidden xl:inline-block text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 hover:text-cyan-500 transition-colors border-l border-slate-200 dark:border-slate-800 pl-2.5 ml-0.5"
            >
              codecrafttechno.com
            </a>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Search gadgets, specs, brands...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full px-4 py-2 pl-10 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>

              {/* Suggestions dropdown */}
              {isFocused && suggestions.length > 0 && (
                <div 
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute left-0 right-0 mt-2 z-55 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto"
                >
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectSuggestion(p.id, p.name)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors w-full text-left"
                    >
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-150 dark:border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          {p.brand}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 shrink-0 font-mono">
                        ₹{p.priceAmazon.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                  <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-950/30 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-mono">
                    <span>{t('searchPressEnter', 'Press Enter to search')}</span>
                    <span>{suggestions.length} {t('matches', 'matches')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions & Buttons */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Find best match Quiz CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenQuiz}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-yellow-400 dark:text-yellow-600" />
              <span>{t('smartQuiz', 'Smart Quiz')}</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </motion.button>

            {/* Dedicated Language Selector */}
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>

            {/* Dark Mode Toggle Switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400 animate-pulse" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-inner"
          >
            <div className="px-4 pt-3 pb-6 space-y-4">
              
               {/* Search on mobile */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={t('searchPlaceholder', 'Search gadgets...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsMobileFocused(true)}
                  onBlur={() => setIsMobileFocused(false)}
                  className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <span className="absolute left-3 top-3 text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>

                {/* Suggestions dropdown on mobile */}
                {isMobileFocused && suggestions.length > 0 && (
                  <div 
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 right-0 mt-2 z-55 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p.id, p.name)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors w-full text-left"
                      >
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-150 dark:border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                            {p.brand}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 shrink-0 font-mono">
                          ₹{p.priceAmazon.toLocaleString('en-IN')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block mb-2">
                  Browse Categories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveCategory(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Switcher for mobile */}
              <div className="flex sm:hidden items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('selectLanguage', 'Select Language')}
                </span>
                <LanguageToggle />
              </div>

              {/* Smart Finder CTA */}
              <button
                onClick={() => {
                  onOpenQuiz();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Award className="w-4 h-4 text-yellow-300" />
                <span>{t('startOver', 'Start Quiz Over')}</span>
              </button>



            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
