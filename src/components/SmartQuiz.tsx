import React, { useState } from 'react';
import { X, Award, Lightbulb, ArrowRight, RotateCcw, Compass, HelpCircle } from 'lucide-react';
import { GadgetProduct } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface SmartQuizProps {
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  products: GadgetProduct[];
}

export default function SmartQuiz({ onClose, onSelectProduct, products }: SmartQuizProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [budget, setBudget] = useState<number>(200000);
  const [preference, setPreference] = useState<string>('');

  const [matchedProduct, setMatchedProduct] = useState<GadgetProduct | null>(null);

  const startQuizOver = () => {
    setStep(1);
    setCategory('');
    setBudget(200000);
    setPreference('');
    setMatchedProduct(null);
  };

  const categories = [
    { id: 'smartphones', label: t('catSmartphonesLabel', 'Smartphone / Mobile phone'), desc: t('catSmartphonesDesc', 'Sleek designs with high-res cameras') },
    { id: 'laptops', label: t('catLaptopsLabel', 'Laptop / Ultrabook'), desc: t('catLaptopsDesc', 'Powerful work, coding or gaming rigs') },
    { id: 'audio', label: t('catAudioLabel', 'Audio / Headphones / Buds'), desc: t('catAudioDesc', 'High fidelity with active noise reduction') },
    { id: 'wearables', label: t('catWearablesLabel', 'Wearable / Smartwatch'), desc: t('catWearablesDesc', 'Sleep and workout trackers with notification sync') }
  ];

  const budgets = [
    { value: 15000, label: t('budgetUnder15k', 'Under ₹15,000'), desc: t('budgetUnder15kDesc', 'Budget friendly essentials') },
    { value: 35000, label: t('budgetUnder35k', 'Under ₹35,000'), desc: t('budgetUnder35kDesc', 'Midrange sweet spot') },
    { value: 80000, label: t('budgetUnder80k', 'Under ₹80,000'), desc: t('budgetUnder80kDesc', 'Premium flagship value') },
    { value: 200000, label: t('budgetUnlimited', 'Unlimited / Flagship'), desc: t('budgetUnlimitedDesc', 'The best of the best performance') }
  ];

  const preferences = [
    { id: 'performance', label: t('prefPerf', 'Maximum Performance / Speed'), desc: t('prefPerfDesc', 'Blazing fast processors for gaming and heavy workloads') },
    { id: 'battery', label: t('prefBattery', 'Legendary Battery Life'), desc: t('prefBatteryDesc', 'Go longer on a single charge without searching for plug') },
    { id: 'camera', label: t('prefCamera', 'Supreme Camera & Creative Quality'), desc: t('prefCameraDesc', 'For content creators, professional photos and videos') },
    { id: 'comfort', label: t('prefComfort', 'Premium Ergonomics / Weight / Style'), desc: t('prefComfortDesc', 'Extremely lightweight, stylish designs and supreme comfort') }
  ];

  const calculateRecommendation = () => {
    // Filter matching category
    let candidates = products.filter(g => g.category === category);
    
    // If empty category, use all
    if (candidates.length === 0) candidates = products;

    // Filter by budget
    let budgetFiltered = candidates.filter(g => Math.min(g.priceAmazon, g.priceFlipkart) <= budget);
    if (budgetFiltered.length > 0) candidates = budgetFiltered;

    // Sort by preference matching specHighlights or pros/cons
    candidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (preference === 'performance') {
        if (a.specHighlights.some(s => s.toLowerCase().includes('chip') || s.toLowerCase().includes('snapdragon') || s.toLowerCase().includes('m3') || s.toLowerCase().includes('rtx'))) scoreA += 5;
        if (b.specHighlights.some(s => s.toLowerCase().includes('chip') || s.toLowerCase().includes('snapdragon') || s.toLowerCase().includes('m3') || s.toLowerCase().includes('rtx'))) scoreB += 5;
      }
      if (preference === 'battery') {
        if (a.specHighlights.some(s => s.toLowerCase().includes('battery') || s.toLowerCase().includes('playback') || s.toLowerCase().includes('18hr'))) scoreA += 5;
        if (b.specHighlights.some(s => s.toLowerCase().includes('battery') || s.toLowerCase().includes('playback') || s.toLowerCase().includes('18hr'))) scoreB += 5;
      }
      if (preference === 'camera') {
        if (a.specHighlights.some(s => s.toLowerCase().includes('camera') || s.toLowerCase().includes('portrait') || s.toLowerCase().includes('sensor'))) scoreA += 5;
        if (b.specHighlights.some(s => s.toLowerCase().includes('camera') || s.toLowerCase().includes('portrait') || s.toLowerCase().includes('sensor'))) scoreB += 5;
      }
      if (preference === 'comfort') {
        if (a.specHighlights.some(s => s.toLowerCase().includes('comfort') || s.toLowerCase().includes('lightweight') || s.toLowerCase().includes('sleek'))) scoreA += 5;
        if (b.specHighlights.some(s => s.toLowerCase().includes('comfort') || s.toLowerCase().includes('lightweight') || s.toLowerCase().includes('sleek'))) scoreB += 5;
      }

      // secondary rating fallback
      return (b.rating + scoreB) - (a.rating + scoreA);
    });

    const match = candidates[0] || products[0];
    setMatchedProduct(match);
    setStep(4);
  };

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
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
            <span className="font-display font-bold text-slate-900 dark:text-slate-100">
              {t('quizTitle', 'Smart Matchmaker Quiz')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div 
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Quiz Steps */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Category selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    {t('quizCategoryQuestion', 'Which gadget category are you looking to buy?')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('quizCategoryDesc', 'Answer 3 simple questions to let our expert algorithm match you.')}</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setStep(2);
                      }}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all group flex flex-col cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{cat.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Budget select */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    {t('quizBudgetQuestion', 'What is your target budget range?')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('quizBudgetDesc', 'We compare cheapest prices across online stores to respect your limit.')}</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {budgets.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => {
                        setBudget(b.value);
                        setStep(3);
                      }}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all group flex flex-col cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{b.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{b.desc}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setStep(1)} 
                  className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 mt-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('backToCategory', 'Back to category')}
                </button>
              </motion.div>
            )}

            {/* Step 3: Priority selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    {t('quizPriorityQuestion', 'What feature is your highest priority?')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('quizPriorityDesc', 'Our advisor weighs expert notes based on this choice.')}</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {preferences.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPreference(p.id);
                        // Complete quiz
                        setTimeout(() => {
                          setPreference(p.id);
                          // Calculate results
                          // we can call a function
                        }, 50);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all group flex flex-col cursor-pointer ${
                        preference === p.id 
                          ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/30' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10'
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={() => setStep(2)} 
                    className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t('backToBudget', 'Back to budget')}
                  </button>

                  <button
                    onClick={calculateRecommendation}
                    disabled={!preference}
                    className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span>{t('getMatchResult', 'Get Match Result')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Show Match Result */}
            {step === 4 && matchedProduct && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-slate-100 leading-tight">
                    {t('quizSuccessTitle', 'We Found Your Perfect Match!')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('quizSuccessDesc', 'Based on budget limit, category choice, and priority focus score.')}</p>
                </div>

                 {/* Match Card Preview */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex flex-col sm:flex-row gap-4 items-center sm:items-start min-w-0">
                  <img 
                    src={matchedProduct.image} 
                    alt={matchedProduct.name}
                    loading="lazy"
                    className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 object-cover rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback: Record<string, string> = {
                        smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
                        laptops: 'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?w=500&auto=format&fit=crop&q=80',
                        audio: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
                        wearables: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=80',
                        accessories: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80'
                      };
                      target.src = fallback[matchedProduct.category] || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">{matchedProduct.brand}</span>
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {matchedProduct.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                      {t('bestPriceLabel', 'Best Price')}: <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(Math.min(matchedProduct.priceAmazon, matchedProduct.priceFlipkart))}</span>
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-1.5">
                      {(matchedProduct.specHighlights || []).slice(0, 2).map((h, i) => (
                        <span key={i} className="text-[9px] bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-600 dark:text-slate-300 animate-none">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advisor Reason */}
                <div className="bg-amber-50 dark:bg-amber-955/15 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/35 text-left">
                  <h5 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    {t('whyWeRecommendThis', 'Why we recommend this:')}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed italic">
                    "{matchedProduct.expertNote}"
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={startQuizOver}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    {t('takeQuizAgain', 'Take Quiz Again')}
                  </button>
                  <button
                    onClick={() => {
                      onSelectProduct(matchedProduct.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>{t('viewProductDetails', 'View Product Details')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
