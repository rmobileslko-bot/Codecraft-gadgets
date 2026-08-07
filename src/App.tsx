import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetailView from './components/ProductDetailView';
import SmartQuiz from './components/SmartQuiz';
import PriceAlertsModal from './components/PriceAlertsModal';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import LatestNewsView from './components/LatestNewsView';
import { GADGETS_DATA, CATEGORIES, SAVED_COUPONS } from './data';
import { getLocalizedProducts, getLocalizedCategories, getLocalizedCoupons } from './utils/localizer';
import { PriceAlert } from './types';
import { savePriceAlertToFirestore, fetchProductsFromFirestore, fetchDeletedProductsFromFirestore } from './lib/firebase';
import { 
  Sparkles, SlidersHorizontal, ArrowUpDown, ShieldCheck, Tag, Info, 
  HelpCircle, ChevronRight, ChevronLeft, Check, CheckCircle2, SearchCode, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const getInitialProducts = () => {
    try {
      const localDeleted: string[] = JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
      const localCustom: any[] = JSON.parse(localStorage.getItem('customProducts') || '[]');
      const deletedSet = new Set(localDeleted);
      const customIds = new Set(localCustom.map((p: any) => p.id));
      const merged = [
        ...localCustom,
        ...GADGETS_DATA.filter((p) => !customIds.has(p.id))
      ];
      return merged.filter((p: any) => !deletedSet.has(p.id));
    } catch (e) {
      return GADGETS_DATA;
    }
  };

  const [productsState, setProductsState] = useState<any[]>(getInitialProducts);
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('admin') === 'true';
      }
    } catch {}
    return false;
  });

  const fetchProducts = async () => {
    // Read local deletions and custom products
    let localDeleted: string[] = [];
    let localCustom: any[] = [];
    try {
      localDeleted = JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
      localCustom = JSON.parse(localStorage.getItem('customProducts') || '[]');
    } catch (e) {
      console.warn('localStorage parse error in fetchProducts:', e);
    }
    const deletedSet = new Set(localDeleted);

    // Fetch from Firestore directly for multi-device instant sync
    let fsProducts: any[] = [];
    try {
      fsProducts = await fetchProductsFromFirestore();
      const fsDeleted = await fetchDeletedProductsFromFirestore();
      if (Array.isArray(fsDeleted)) {
        fsDeleted.forEach((id) => deletedSet.add(id));
      }
    } catch (e) {
      console.warn('Client Firestore product fetch:', e);
    }

    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('API server returned non-200');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Merge API data with Firestore and local custom products
          const existingIds = new Set(data.map((p: any) => p.id));
          const extraFs = fsProducts.filter((p) => p && p.id && !existingIds.has(p.id));
          extraFs.forEach((p) => existingIds.add(p.id));
          const extraCustom = localCustom.filter((cp: any) => !existingIds.has(cp.id));
          
          const merged = [...extraCustom, ...extraFs, ...data];
          const filtered = merged.filter((p: any) => !deletedSet.has(p.id));
          setProductsState(filtered);
        }
      })
      .catch(err => {
        console.warn('Error or fallback for API products, applying client & Firestore storage:', err);
        const existingIds = new Set(fsProducts.map((p: any) => p.id));
        const extraCustom = localCustom.filter((cp: any) => !existingIds.has(cp.id));
        const defaultExtra = GADGETS_DATA.filter((p) => !existingIds.has(p.id) && !extraCustom.some((c) => c.id === p.id));
        
        const merged = [...extraCustom, ...fsProducts, ...defaultExtra];
        const filtered = merged.filter((p: any) => !deletedSet.has(p.id));
        setProductsState(filtered);
      });
  };

  const fetchAlerts = () => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPriceAlerts(data);
        }
      })
      .catch(err => console.warn('Error fetching API alerts:', err));
  };

  React.useEffect(() => {
    fetchProducts();
    fetchAlerts();
  }, [isAdminView]);

  const localizedGadgets = useMemo(() => {
    return getLocalizedProducts(productsState, currentLang);
  }, [productsState, currentLang]);

  const localizedCategories = useMemo(() => {
    return getLocalizedCategories(CATEGORIES, currentLang);
  }, [currentLang]);

  const localizedCoupons = useMemo(() => {
    return getLocalizedCoupons(SAVED_COUPONS, currentLang);
  }, [currentLang]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Navigation & filtering states
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('preferredCategory');
        return saved || 'all';
      }
    } catch (e) {
      console.warn('Failed to read preferredCategory from localStorage:', e);
    }
    return 'all';
  });
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('product') || null;
      }
    } catch (e) {
      console.warn('Failed to read product from URLSearchParams:', e);
    }
    return null;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('preferredCategory', activeCategory);
    } catch (e) {
      console.warn('Failed to save preferredCategory to localStorage:', e);
    }
  }, [activeCategory]);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (selectedProductId) {
          url.searchParams.set('product', selectedProductId);
        } else {
          url.searchParams.delete('product');
        }
        window.history.pushState({}, '', url.toString());
      }
    } catch (e) {
      console.warn('Failed to update URL search params for product:', e);
    }
  }, [selectedProductId]);

  const selectedProduct = useMemo(() => {
    return localizedGadgets.find((g) => g.id === selectedProductId) || null;
  }, [selectedProductId, localizedGadgets]);

  // Dynamic meta-tag management functionality for SEO optimization and search indexing
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let title = 'CodeCraft Techno - Expert Gadget Recommendations & Tech Deals';
    let description = 'Discover premium technology products, laptops, smartphones, and audio gear curated with real-time specs, price trends, and verified affiliate deals.';
    let keywords = 'tech gadgets, product reviews, price comparison, smartphone spec finder, laptop buyer guide, CodeCraft Techno';

    let schemaData: any = null;

    if (selectedProduct) {
      title = `${selectedProduct.name} - Reviews, Specs & Best Price | CodeCraft Techno`;
      description = selectedProduct.expertNote 
        ? selectedProduct.expertNote.substring(0, 155) + '...'
        : `Read detailed reviews, specs, and find the best affiliate deals for the ${selectedProduct.name}.`;
      keywords = `${selectedProduct.name}, ${selectedProduct.brand || ''}, ${selectedProduct.category || ''}, specs, price history, reviews, CodeCraft Techno`;

      // 1. Build a highly detailed Product schema
      const offersList: any[] = [];
      if (selectedProduct.priceAmazon && selectedProduct.priceAmazon > 0) {
        offersList.push({
          "@type": "Offer",
          "price": selectedProduct.priceAmazon,
          "priceCurrency": "INR",
          "url": selectedProduct.buyUrlAmazon || window.location.href,
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "Amazon India"
          }
        });
      }

      // Safe fallback if zero prices found
      if (offersList.length === 0) {
        offersList.push({
          "@type": "Offer",
          "price": selectedProduct.originalPrice || 0,
          "priceCurrency": "INR",
          "url": window.location.href,
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "CodeCraft Techno"
          }
        });
      }

      const prices = [selectedProduct.priceAmazon, selectedProduct.originalPrice].filter(p => p && p > 0);
      const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const highPrice = prices.length > 0 ? Math.max(...prices) : 0;

      schemaData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": selectedProduct.name,
        "image": selectedProduct.image || "https://codecrafttechno.com/default-gadget.png",
        "description": description,
        "category": selectedProduct.category,
        "brand": {
          "@type": "Brand",
          "name": selectedProduct.brand || "Generic"
        },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": lowPrice,
          "highPrice": highPrice,
          "offerCount": offersList.length,
          "offers": offersList
        },
        "aggregateRating": selectedProduct.rating ? {
          "@type": "AggregateRating",
          "ratingValue": selectedProduct.rating,
          "bestRating": "5",
          "worstRating": "1",
          "reviewCount": selectedProduct.reviewsCount || 12
        } : undefined,
        "additionalProperty": Object.entries(selectedProduct.specs || {}).map(([key, val]) => ({
          "@type": "PropertyValue",
          "name": key,
          "value": String(val)
        }))
      };
    } else {
      // 2. Organization / WebSite schema for general homepage
      schemaData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "CodeCraft Techno",
        "url": "https://codecrafttechno.com/",
        "description": description,
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://codecrafttechno.com/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      };
    }

    // 1. Update document Title
    document.title = title;

    // 2. Helper to set/update dynamic meta tags in the document head
    const updateMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);

    // 3. Inject/Update JSON-LD script tag
    let schemaScript = document.getElementById('json-ld-schema') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schemaData, null, 2);

  }, [selectedProduct]);

  // Interactive popup modals
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Price alerts array state (starts with 2 realistic ones for immersive feel, then persists in localStorage!)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codecraft_price_alerts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error loading price alerts from localStorage:', e);
        }
      }
    }
    return [
      {
        id: 'alert-initial-1',
        productId: 'macbook-air-m3',
        productName: 'Apple MacBook Air Laptop M3',
        targetPrice: 99000,
        email: 'user@example.com',
        store: 'amazon',
        status: 'active'
      }
    ];
  });

  // Save price alerts to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('codecraft_price_alerts', JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  // Floating confirmation toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleAddPriceAlert = (
    productId: string, 
    productName: string, 
    targetPrice: number, 
    store: 'amazon' | 'flipkart', 
    email: string
  ) => {
    const newAlert: PriceAlert = {
      id: `alert-${Math.random().toString(36).substring(2, 9)}`,
      productId,
      productName,
      targetPrice,
      email,
      store,
      status: 'active'
    };
    setPriceAlerts((prev) => [newAlert, ...prev]);

    // Save to local Express backend server
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert),
    }).catch((err) => console.error('Failed to sync alert to local server:', err));

    // Save to Firestore if connected
    try {
      savePriceAlertToFirestore(newAlert);
    } catch (fbErr) {
      console.warn('Firebase sync skipped:', fbErr);
    }

    addToast(`Price drop alert set for ${productName.substring(0, 20)}... at ₹${targetPrice.toLocaleString()}`, 'success');
  };

  const handleRemovePriceAlert = (id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));

    // Remove from local Express backend server
    fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to delete alert from local server:', err));

    addToast('Price alert tracker removed', 'info');
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    addToast(`Coupon code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  // Get unique brands for the brand filter dropdown
  const availableBrands = useMemo(() => {
    const brands = localizedGadgets.map(g => g.brand);
    return ['all', ...Array.from(new Set(brands))];
  }, [localizedGadgets]);

  // Filter and sort the curated gadget inventory
  const filteredGadgets = useMemo(() => {
    let result = [...localizedGadgets];

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(g => g.category === activeCategory);
    }

    // Filter by brand
    if (brandFilter !== 'all') {
      result = result.filter(g => g.brand === brandFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        g => 
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.expertNote.toLowerCase().includes(q) ||
          g.specHighlights.some(hl => hl.toLowerCase().includes(q))
      );
    }

    // Sorting algorithm
    if (sortBy === 'price-low') {
      result.sort((a, b) => Math.min(a.priceAmazon, a.priceFlipkart) - Math.min(b.priceAmazon, b.priceFlipkart));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Math.max(b.priceAmazon, b.priceFlipkart) - Math.max(a.priceAmazon, a.priceFlipkart));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const discA = Math.round(((a.originalPrice - Math.min(a.priceAmazon, a.priceFlipkart)) / a.originalPrice) * 100);
        const discB = Math.round(((b.originalPrice - Math.min(b.priceAmazon, b.priceFlipkart)) / b.originalPrice) * 100);
        return discB - discA;
      });
    }

    return result;
  }, [activeCategory, searchQuery, sortBy, brandFilter, localizedGadgets]);

  // Pagination logic (10 items per page limit)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortBy, brandFilter]);

  const totalPages = Math.ceil(filteredGadgets.length / ITEMS_PER_PAGE) || 1;

  const paginatedGadgets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGadgets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGadgets, currentPage]);

  // Quick action: Selecting a product from quiz jumps to its card anchor
  const handleSelectProductFromQuiz = (productId: string) => {
    setSearchQuery('');
    setActiveCategory('all');
    setBrandFilter('all');
    setTimeout(() => {
      const card = document.getElementById(`product-card-${productId}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary subtle highlight pulse
        card.classList.add('ring-4', 'ring-indigo-500/50');
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-indigo-500/50');
        }, 3000);
      }
    }, 150);
  };

  if (isAdminView) {
    return (
      <AdminPanel 
        onBack={() => setIsAdminView(false)} 
        onRefreshCatalog={fetchProducts} 
        products={productsState} 
        addToast={addToast}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans overflow-x-hidden`} id="cc-app-root">
      
      {/* 1. Dynamic Notification Toasts */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 max-w-sm pointer-events-auto bg-white dark:bg-slate-900 dark:border-slate-800 ${
                toast.type === 'error'
                  ? 'border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
                  : toast.type === 'success' 
                    ? 'border-emerald-100 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200' 
                    : 'border-indigo-100 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-500" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. Top Navigation Header */}
      <Header
        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
          setActiveCategory(cat);
          setBrandFilter('all'); // reset brand on category change
          setSelectedProductId(null); // clear detail view
        }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setSelectedProductId(null); // clear detail view
        }}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        activeAlertsCount={priceAlerts.length}
        onOpenQuiz={() => setIsQuizOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAdmin={() => setIsAdminView(true)}
        products={localizedGadgets}
        onSelectProduct={(productId) => {
          setSelectedProductId(productId);
          setSearchQuery('');
        }}
      />

      {/* 3. Immersive Hero Header */}
      {!selectedProductId && (
        <Hero 
          onOpenQuiz={() => setIsQuizOpen(true)}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            setSelectedProductId(null);
            const el = document.getElementById('gadget-showcase');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 4. Active Promo Coupons Ticker */}
      {!selectedProductId && localizedCoupons && localizedCoupons.length > 0 && (
        <section className="bg-gradient-to-r from-indigo-800 to-slate-900 dark:from-slate-900 dark:to-indigo-950 py-4 text-white shadow-inner transition-colors duration-300" id="cc-coupons-strip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center md:text-left">
              <span className="p-1 bg-white/20 rounded-md">
                <Tag className="w-4 h-4 text-yellow-300" />
              </span>
              <p className="text-xs sm:text-sm font-medium">
                <strong className="text-yellow-300 font-extrabold uppercase">{t('exclusiveSavings', 'EXCLUSIVE EXTRA SAVINGS:')}</strong> {t('exclusiveSavingsSub', 'Copy verified partner coupons below to use at checkout!')}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {localizedCoupons.map((coupon) => (
                <button
                  key={coupon.code}
                  onClick={() => handleCopyCouponCode(coupon.code)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 dark:border-white/10 rounded text-[11px] font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={coupon.description}
                >
                  <span>{coupon.code}</span>
                  <span className="opacity-60">|</span>
                  <span className="text-yellow-200">{coupon.discount.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Core Showcase Stage, Latest Gadget News, or Dynamic Product Detail Page */}
      {selectedProductId && selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onBack={() => setSelectedProductId(null)}
          onAddAlert={handleAddPriceAlert}
          copiedCoupon={copiedCoupon}
          onCopyCoupon={handleCopyCouponCode}
        />
      ) : activeCategory === 'news' ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="gadget-news-page">
          <LatestNewsView onSelectCategory={(cat) => setActiveCategory(cat)} />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="gadget-showcase">
          
          {/* Title area & control selectors */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
            
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 leading-none">
                {t('curatedInventory', 'Curated Gadget Inventory')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {t('showingCount', 'Showing {{count}} of {{total}} premium models evaluated by codecraft-gadgets editors.', { count: filteredGadgets.length, total: localizedGadgets.length })}
              </p>
            </div>

            {/* Interactive controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Filter by Brand */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 transition-colors duration-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-900">{t('allBrands', 'All Brands')}</option>
                  {availableBrands.filter(b => b !== 'all').map(brand => (
                    <option key={brand} value={brand} className="dark:bg-slate-900">{brand}</option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 transition-colors duration-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="featured" className="dark:bg-slate-900">{t('featured', 'Featured / Editors Pick')}</option>
                  <option value="price-low" className="dark:bg-slate-900">{t('priceLowHigh', 'Price: Low to High')}</option>
                  <option value="price-high" className="dark:bg-slate-900">{t('priceHighLow', 'Price: High to Low')}</option>
                  <option value="rating" className="dark:bg-slate-900">{t('topRated', 'Top Rated (Stars)')}</option>
                  <option value="discount" className="dark:bg-slate-900">{t('bestDiscount', 'Biggest Discount (%)')}</option>
                </select>
              </div>

              {/* Clear All search query tags */}
              {(searchQuery || brandFilter !== 'all' || activeCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setBrandFilter('all');
                    setActiveCategory('all');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {t('resetFilters', 'Reset Filters')}
                </button>
              )}

            </div>

          </div>

          {/* Dynamic Category Chips Row */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setBrandFilter('all'); // reset brand filter on category shift
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-102'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-750 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search feedback header if active query */}
          {searchQuery && (
            <div className="mb-6 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2 text-xs text-indigo-800 dark:text-indigo-300 transition-colors duration-300">
              <SearchCode className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Showing filter results matching <strong>"{searchQuery}"</strong>.</span>
            </div>
          )}

          {/* Grid layout for cards */}
          {filteredGadgets.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-850 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto transition-colors duration-300">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-200">No matching gadgets found</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  We couldn't locate any items matching your selected criteria. Try resetting filters or choosing another category.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setBrandFilter('all');
                    setActiveCategory('all');
                  }}
                  className="px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-md cursor-pointer"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={async () => {
                    localStorage.removeItem('deletedProductIds');
                    try {
                      const res = await fetch('/api/products/reset', { method: 'POST' });
                      if (res.ok) {
                        fetchProducts();
                      }
                    } catch {}
                    setSearchQuery('');
                    setBrandFilter('all');
                    setActiveCategory('all');
                  }}
                  className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs rounded-lg shadow-md cursor-pointer"
                >
                  Restore Full Catalog
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {paginatedGadgets.map((gadget) => (
                  <motion.div 
                    key={gadget.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard
                      product={gadget}
                      onAddAlert={handleAddPriceAlert}
                      copiedCoupon={copiedCoupon}
                      setCopiedCoupon={setCopiedCoupon}
                      onViewDetail={setSelectedProductId}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination Bar */}
              {filteredGadgets.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredGadgets.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredGadgets.length}</span> gadgets
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                          const showcase = document.getElementById('gadget-showcase');
                          if (showcase) showcase.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              const showcase = document.getElementById('gadget-showcase');
                              if (showcase) showcase.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                          const showcase = document.getElementById('gadget-showcase');
                          if (showcase) showcase.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </main>
      )}

      {/* 6. Professional trust details banner */}
      <section className="bg-white dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 py-10 transition-colors duration-300" id="cc-trust-banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <h4 className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Verified Direct Links</span>
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Redirecting safely to premium certified online outlets. No nested interstitial loops or unsafe redirect tracking lines.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>6-Month Chart Logs</span>
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              We update price trends multiple times daily to give accurate analytics of current pricing levels compared to previous sales.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Safe Data Vault</span>
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Any price alert you configure stays private. We do not require account logins or passwords for complete tool transparency.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Footer component */}
      <Footer onOpenAdmin={() => setIsAdminView(true)} />

      {/* Interactive popups (Conditional mounting) */}
      <AnimatePresence>
        {isQuizOpen && (
          <SmartQuiz
            onClose={() => setIsQuizOpen(false)}
            onSelectProduct={handleSelectProductFromQuiz}
            products={localizedGadgets}
          />
        )}

        {isAlertsOpen && (
          <PriceAlertsModal
            alerts={priceAlerts}
            onRemoveAlert={handleRemovePriceAlert}
            onClose={() => setIsAlertsOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
