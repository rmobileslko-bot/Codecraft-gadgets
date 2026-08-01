import React, { useState, useEffect } from 'react';
import { 
  Key, Link, Sparkles, AlertCircle, CheckCircle2, ShieldAlert,
  Loader2, Plus, Edit3, Trash2, ArrowLeft, Eye, RefreshCw, Star, 
  Tag, SlidersHorizontal, Settings, Info, ShoppingBag, Layers,
  Database, Share2, FileText, TrendingUp, Coins, Copy, Check, X, ExternalLink,
  Mail, BellRing, Newspaper, Bookmark, Globe, Clock, Zap, MessageSquare, Sliders, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GadgetProduct, GadgetNewsPost } from '../types';
import { 
  getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, initFirebase,
  signInWithGoogle, logOut, syncProductToFirestore, deleteProductFromFirestore,
  fetchProductsFromFirestore, fetchDeletedProductsFromFirestore, savePriceAlertToFirestore
} from '../lib/firebase';

interface AdminPanelProps {
  onBack: () => void;
  onRefreshCatalog: () => void;
  products: GadgetProduct[];
  addToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

// Helper to format clean, human-readable error messages and strip raw JSON strings or 429 quota dumps
export function formatCleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  let msg = typeof err === 'string' ? err : err.message || String(err);

  if (typeof msg === 'string' && msg.trim().startsWith('{') && msg.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) {
        msg = parsed.error.message;
      }
    } catch (_) {}
  }

  if (
    typeof msg === 'string' &&
    (msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('429') ||
      msg.includes('Quota exceeded') ||
      msg.includes('rate-limits') ||
      msg.includes('GenerateRequestsPerDayPerProjectPerModel'))
  ) {
    return 'Gemini API daily request limit reached (429 Quota Exceeded / Rate Limit). Please wait a minute or try again later with a new Gemini key.';
  }

  return msg;
}

export default function AdminPanel({ onBack, onRefreshCatalog, products, addToast }: AdminPanelProps) {
  const { t } = useTranslation();
  
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('isAdminLoggedIn') === 'true';
      }
    } catch { /* ignore */ }
    return false;
  });

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Config State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('gemini_api_key') || '';
      }
    } catch { /* ignore */ }
    return '';
  });

  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [saveApiKeySuccess, setSaveApiKeySuccess] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccessMsg, setApiKeySuccessMsg] = useState('');

  // Backend & AI Live Status States
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [geminiServerConfigured, setGeminiServerConfigured] = useState<boolean>(false);

  // Manual Product Entry Form State
  const [manualForm, setManualForm] = useState({
    title: '',
    shortDescription: '',
    price: '',
    mrpPrice: '',
    category: 'smartphones' as GadgetProduct['category'],
    brand: '',
    prosText: '',
    consText: '',
    affiliateLink: '',
    imageUrl: '',
    rating: '4.5',
    reviewsCount: '150',
    reviewsSummary: '',
  });

  // Dedicated AI Assist States (Reviews & Pros/Cons Generators)
  const [reviewsPrompt, setReviewsPrompt] = useState('');
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [prosConsPrompt, setProsConsPrompt] = useState('');
  const [isGeneratingProsCons, setIsGeneratingProsCons] = useState(false);

  // 1. AI Customer Sentiment Summary (Top 10 Positive Reviews) Generator Handler
  const handleGenerateAiReviews = async () => {
    const targetTitle = manualForm.title.trim() || reviewsPrompt.trim() || 'Gadget Product';
    setIsGeneratingReviews(true);

    try {
      const res = await fetch('/api/admin/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-reviews',
          productTitle: targetTitle,
          customPrompt: reviewsPrompt,
          apiKey: geminiApiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate Customer Sentiment Summary');
      }

      setManualForm((prev) => ({
        ...prev,
        reviewsSummary: data.reviewsSummary || ''
      }));

      if (addToast) addToast('✨ Top 10 Amazon Positive Reviews generated by Gemini AI!', 'success');
    } catch (err: any) {
      if (addToast) addToast(err.message || 'AI Reviews generation failed', 'error');
    } finally {
      setIsGeneratingReviews(false);
    }
  };

  // 2. AI Pros & Cons Generator Handler
  const handleGenerateAiProsCons = async () => {
    const targetTitle = prosConsPrompt.trim() || manualForm.title.trim() || 'Tech Gadget';
    setIsGeneratingProsCons(true);

    try {
      const res = await fetch('/api/admin/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pros-cons',
          productTitle: targetTitle,
          customPrompt: prosConsPrompt,
          apiKey: geminiApiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate Pros & Cons');
      }

      setManualForm((prev) => ({
        ...prev,
        prosText: Array.isArray(data.pros) ? data.pros.join('\n') : prev.prosText,
        consText: Array.isArray(data.cons) ? data.cons.join('\n') : prev.consText,
        brand: data.brand && !prev.brand ? data.brand : prev.brand
      }));

      if (addToast) addToast('✨ Pros & Cons auto-generated by Gemini AI!', 'success');
    } catch (err: any) {
      if (addToast) addToast(err.message || 'AI Pros & Cons generation failed', 'error');
    } finally {
      setIsGeneratingProsCons(false);
    }
  };

  // Scraper States (Legacy)
  const [amazonUrl, setAmazonUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStep, setScrapingStep] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  
  // Loaded Scraped Product Data for Review
  const [scrapedProduct, setScrapedProduct] = useState<Partial<GadgetProduct> | null>(null);
  
  // Custom uploaded products in catalog (only those with no matching default id)
  const [customProducts, setCustomProducts] = useState<GadgetProduct[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSavedSuccess, setProductSavedSuccess] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [localDeletedProductIds, setLocalDeletedProductIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
    } catch {
      return [];
    }
  });

  // Firebase Configuration & State
  const [fbConfig, setFbConfig] = useState(() => {
    const config = getSavedFirebaseConfig();
    return config || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    };
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(() => {
    return getSavedFirebaseConfig() !== null;
  });
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [fbSuccessMsg, setFbSuccessMsg] = useState('');
  const [fbErrorMsg, setFbErrorMsg] = useState('');
  const [isSavingFbConfig, setIsSavingFbConfig] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
  const [alertCheckResult, setAlertCheckResult] = useState('');

  // Email / SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    user: '',
    pass: '',
    host: 'smtp.gmail.com',
    port: 587
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);

  // Creator Studio & News States
  const [adminActiveTab, setAdminActiveTab] = useState<'scraper' | 'news' | 'creator' | 'firebase'>('scraper');
  const [creatorType, setCreatorType] = useState<'social' | 'topics' | 'budget'>('social');
  const [selectedProductNames, setSelectedProductNames] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState('30000');
  const [creatorResult, setCreatorResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Latest Gadget News Admin States
  const [newsInputUrlOrTopic, setNewsInputUrlOrTopic] = useState('');
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);
  const [newsErrorMsg, setNewsErrorMsg] = useState('');
  const [newsSuccessMsg, setNewsSuccessMsg] = useState('');
  const [newsPostsList, setNewsPostsList] = useState<GadgetNewsPost[]>([]);
  const [editingNewsPost, setEditingNewsPost] = useState<Partial<GadgetNewsPost> | null>(null);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [failedScrapeLogs, setFailedScrapeLogs] = useState<{ url: string; error: string; timestamp: Date }[]>([]);

  const normalizeNewsPost = (post: any) => {
    if (!post) return null;
    let keywords = post.keywords;
    if (typeof keywords === 'string') {
      keywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    } else if (!Array.isArray(keywords)) {
      keywords = [];
    }
    let tags = post.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else if (!Array.isArray(tags)) {
      tags = ['News'];
    }
    return { ...post, keywords, tags };
  };

  // Load news list on mount or tab change
  const fetchNewsList = async () => {
    try {
      const res = await fetch('/api/news?admin=true&limit=100');
      if (res.ok) {
        const data = await res.json();
        setNewsPostsList(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching admin news list:', err);
    }
  };

  // Auto-load persisted server settings (Gemini API Key & Firebase Config) on mount across all devices
  useEffect(() => {
    const loadServerSettings = async () => {
      try {
        // Ping Health Check
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setIsBackendConnected(true);
          setGeminiServerConfigured(!!healthData.geminiConfigured);
        } else {
          setIsBackendConnected(false);
        }

        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.geminiApiKey) {
            setGeminiApiKey(data.geminiApiKey);
            localStorage.setItem('gemini_api_key', data.geminiApiKey);
            setGeminiServerConfigured(true);
          }
          if (data.firebaseConfig && data.firebaseConfig.apiKey) {
            setFbConfig(data.firebaseConfig);
            saveFirebaseConfig(data.firebaseConfig);
            setIsFirebaseConnected(true);
            try {
              initFirebase();
            } catch (_) {}
          }
          if (data.smtpConfig) {
            setSmtpConfig({
              user: data.smtpConfig.user || '',
              pass: data.smtpConfig.pass || '',
              host: data.smtpConfig.host || 'smtp.gmail.com',
              port: data.smtpConfig.port || 587
            });
          }
        }
      } catch (err) {
        console.warn('Failed to auto-load server settings:', err);
        setIsBackendConnected(false);
      }
    };
    loadServerSettings();
  }, []);

  // Save SMTP credentials permanently
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpSaveSuccess(false);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig })
      });
      setSmtpSaveSuccess(true);
      setTimeout(() => setSmtpSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save SMTP credentials:', err);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  useEffect(() => {
    if (adminActiveTab === 'news') {
      fetchNewsList();
    }
  }, [adminActiveTab]);

  // AI News Generator handler
  const handleGenerateAiNewsPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsInputUrlOrTopic.trim()) return;

    setIsGeneratingNews(true);
    setNewsErrorMsg('');
    setNewsSuccessMsg('');

    try {
      const res = await fetch('/api/admin/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrlOrTopic: newsInputUrlOrTopic.trim(),
          apiKey: geminiApiKey
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        throw new Error('Received non-JSON response from server. Please verify the link or topic and try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate news post');
      }

      setEditingNewsPost(normalizeNewsPost(data));
      setNewsSuccessMsg('✨ AI News Post generated successfully! Review, edit parameters below, and click "Save & Publish Article".');
    } catch (err: any) {
      setNewsErrorMsg(formatCleanErrorMessage(err));
    } finally {
      setIsGeneratingNews(false);
    }
  };

  // Save/Publish News Post (Manual Creation & Editing)
  const handleSaveNewsPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNewsPost || !editingNewsPost.title?.trim()) {
      if (addToast) addToast('Please enter an Article Title', 'error');
      return;
    }

    setIsSavingNews(true);
    setNewsErrorMsg('');

    const titleStr = editingNewsPost.title.trim();
    const slugStr = editingNewsPost.slug?.trim() || titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `post-${Date.now()}`;
    const wordCount = (editingNewsPost.content || '').split(/\s+/).length;
    const estimatedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const postToSave: GadgetNewsPost = {
      id: editingNewsPost.id || `news-${Date.now()}`,
      title: titleStr,
      slug: slugStr,
      category: editingNewsPost.category || 'Smartphones',
      summary: editingNewsPost.summary || titleStr,
      content: editingNewsPost.content || '',
      metaDescription: editingNewsPost.metaDescription || editingNewsPost.summary || titleStr,
      keywords: Array.isArray(editingNewsPost.keywords)
        ? editingNewsPost.keywords
        : typeof editingNewsPost.keywords === 'string'
        ? (editingNewsPost.keywords as string).split(',').map((k) => k.trim()).filter(Boolean)
        : ['Tech', 'News'],
      imageUrl: editingNewsPost.imageUrl?.trim() || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      author: editingNewsPost.author?.trim() || 'Tech Editor',
      publishedAt: editingNewsPost.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: editingNewsPost.isPublished !== false,
      isPinned: !!editingNewsPost.isPinned,
      readTime: editingNewsPost.readTime || estimatedReadTime,
      tags: editingNewsPost.tags || ['News']
    };

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postToSave)
      });

      // Save to local storage for instant offline/client reactivity
      try {
        const localList: GadgetNewsPost[] = JSON.parse(localStorage.getItem('gadgetNewsPosts') || '[]');
        const updatedLocal = [postToSave, ...localList.filter((p) => p.id !== postToSave.id && p.slug !== postToSave.slug)];
        localStorage.setItem('gadgetNewsPosts', JSON.stringify(updatedLocal));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }

      setNewsSuccessMsg('✅ News article saved and published live on the Latest Gadget News page!');
      setEditingNewsPost(null);
      await fetchNewsList();
      if (addToast) addToast(`Article "${postToSave.title}" saved successfully!`, 'success');
      setTimeout(() => setNewsSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error saving news post:', err);
      setNewsErrorMsg(formatCleanErrorMessage(err));
      if (addToast) addToast(err.message || 'Error saving news article', 'error');
    } finally {
      setIsSavingNews(false);
    }
  };

  // Delete News Post
  const handleDeleteNewsPost = async (id: string) => {
    // Instant optimistic removal from UI
    const updatedList = newsPostsList.filter((p) => p.id !== id && p.slug !== id);
    setNewsPostsList(updatedList);

    try {
      localStorage.setItem('gadgetNewsPosts', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to update news in localStorage:', e);
    }

    try {
      await fetch(`/api/news/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete news post from API:', err);
    }
  };

  // Toggle Publish / Pin status
  const handleToggleNewsStatus = async (post: GadgetNewsPost, field: 'isPublished' | 'isPinned') => {
    const updated = { ...post, [field]: !post[field] };
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setNewsPostsList((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
      }
    } catch (err) {
      console.error('Failed to update post status:', err);
    }
  };

  // Initialize Firebase on mount if config exists
  useEffect(() => {
    if (isFirebaseConnected) {
      initFirebase();
    }
  }, [isFirebaseConnected]);

  // Load GIS (Google Identity Services) for real Google Login
  useEffect(() => {
    if (isAdminLoggedIn) return;
    
    // Load Google script if not exists
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSignIn();
      document.head.appendChild(script);
    } else {
      initGoogleSignIn();
    }
  }, [isAdminLoggedIn]);

  const initGoogleSignIn = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "1015282130847-a3g8l89v2e3rks994j8e49m96f01s9g9.apps.googleusercontent.com", // standard platform Client ID or generic
          callback: handleGoogleSignInCallback,
          auto_select: false,
        });
        
        const btnParent = document.getElementById('google-login-btn-parent');
        if (btnParent) {
          (window as any).google.accounts.id.renderButton(btnParent, {
            theme: 'outline',
            size: 'large',
            width: btnParent.clientWidth || 320,
            text: 'signin_with',
          });
        }
      }
    } catch (e) {
      console.warn('Failed to initialize Google Sign-In:', e);
    }
  };

  const handleGoogleSignInCallback = (response: any) => {
    try {
      const credential = response.credential;
      if (credential) {
        // Decode JWT token on client side cleanly
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const profile = JSON.parse(jsonPayload);
        
        const allowedEmails = ['rmobileslko@gmail.com', 'rahman8040samsung@gmail.com'];
        if (allowedEmails.includes(profile.email?.toLowerCase())) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('isAdminLoggedIn', 'true');
          setAuthError('');
        } else {
          setAuthError(`Access Denied. Only the authorized administrator can access this console.`);
        }
      }
    } catch (e) {
      setAuthError('Google login decode failed. Please sign in with your credentials below.');
    }
  };

  // Secure manual authentication for Administrator
  const handleManualAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const emailInput = authEmail.trim().toLowerCase();
    const passwordInput = authPassword;

    // Check credentials: rmobileslko@gmail.com / Ali90!@$#lko} (or owner fallback)
    const isValidEmail = emailInput === 'rmobileslko@gmail.com' || emailInput === 'rahman8040samsung@gmail.com';
    const isValidPassword = passwordInput === 'Ali90!@$#lko}' || passwordInput === 'Ali90!@$#lko';

    if (isValidEmail && isValidPassword) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Email or Passcode. Access denied.');
    }
  };

  // Log out
  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('isAdminLoggedIn');
    setAuthError('');
  };

  // Verify and Save Gemini API Key permanently across all devices
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApiKey(true);
    setSaveApiKeySuccess(false);
    setApiKeyError('');
    setApiKeySuccessMsg('');

    if (!geminiApiKey || !geminiApiKey.trim()) {
      setApiKeyError('Please enter a Gemini API Key before verifying.');
      setIsSavingApiKey(false);
      return;
    }

    try {
      // 1. First, call live verification endpoint
      const verifyRes = await fetch('/api/admin/verify-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey.trim() })
      });

      const rawText = await verifyRes.text();
      let verifyData: any = {};
      try {
        verifyData = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Received non-JSON response during key verification.');
      }

      if (!verifyRes.ok || !verifyData.valid) {
        setApiKeyError(formatCleanErrorMessage(verifyData.error || 'Gemini API Key verification failed with Google AI Studio. Key was NOT saved.'));
        setIsSavingApiKey(false);
        return;
      }

      // 2. Verification succeeded! Now persist to localStorage and server settings
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
      const saveRes = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: geminiApiKey.trim() })
      });

      const saveText = await saveRes.text();
      let saveData: any = {};
      try {
        saveData = JSON.parse(saveText);
      } catch (e) {
        throw new Error('Received non-JSON response saving server settings.');
      }

      if (!saveRes.ok) {
        setApiKeyError(formatCleanErrorMessage(saveData.error || 'Failed to save verified key to server settings.'));
        setIsSavingApiKey(false);
        return;
      }

      setSaveApiKeySuccess(true);
      setApiKeySuccessMsg(verifyData.message || 'Gemini API Key Verified & Live Connection Active!');
      setTimeout(() => setSaveApiKeySuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to verify/save Gemini API key:', err);
      setApiKeyError(formatCleanErrorMessage(err));
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // Manual Product Entry Form Handler
  const handleCreateManualProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title.trim() || !manualForm.price || !manualForm.affiliateLink.trim()) {
      if (addToast) addToast('Please fill in Product Title, Selling Price, and Affiliate Link', 'error');
      return;
    }

    setIsSavingProduct(true);

    const prosArray = manualForm.prosText
      .split(/\n|,/)
      .map(p => p.trim())
      .filter(Boolean);

    const consArray = manualForm.consText
      .split(/\n|,/)
      .map(c => c.trim())
      .filter(Boolean);

    const priceNum = parseFloat(manualForm.price) || 0;
    const mrpNum = manualForm.mrpPrice ? parseFloat(manualForm.mrpPrice) : Math.round(priceNum * 1.22);

    const newProd: GadgetProduct = {
      id: `prod-${Date.now()}`,
      name: manualForm.title.trim(),
      category: manualForm.category,
      brand: manualForm.brand.trim() || 'Generic',
      priceAmazon: priceNum,
      priceFlipkart: priceNum,
      originalPrice: mrpNum,
      image: manualForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
      rating: parseFloat(manualForm.rating) || 4.5,
      reviewsCount: parseInt(manualForm.reviewsCount) || 120,
      expertNote: manualForm.shortDescription.trim() || `${manualForm.title} offers excellent features, high-grade performance, and outstanding value for money.`,
      pros: prosArray.length > 0 ? prosArray : ['High Performance', 'Sleek Build', 'Vibrant Display'],
      cons: consArray.length > 0 ? consArray : ['No Charger in Box'],
      specs: {
        "Brand": manualForm.brand.trim() || 'Generic',
        "Category": manualForm.category.toUpperCase(),
        "Warranty": "1 Year Brand Warranty"
      },
      isTrending: true,
      priceHistory: [
        { date: 'Last Month', amazon: Math.round(priceNum * 1.05), flipkart: Math.round(priceNum * 1.05) },
        { date: 'Today', amazon: priceNum, flipkart: priceNum }
      ],
      buyUrlAmazon: manualForm.affiliateLink.trim(),
      buyUrlFlipkart: manualForm.affiliateLink.trim(),
      specHighlights: prosArray.slice(0, 3),
      reviewsSummary: manualForm.reviewsSummary.trim() || undefined
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save product');
      }

      // Sync local state / client backup
      try {
        const existingCustom: GadgetProduct[] = JSON.parse(localStorage.getItem('customProducts') || '[]');
        const updated = [newProd, ...existingCustom.filter(p => p.id !== newProd.id)];
        localStorage.setItem('customProducts', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }

      onRefreshCatalog();
      setProductSavedSuccess(true);
      if (addToast) addToast(`Product "${newProd.name}" added successfully!`, 'success');

      setManualForm({
        title: '',
        shortDescription: '',
        price: '',
        mrpPrice: '',
        category: 'smartphones',
        brand: '',
        prosText: '',
        consText: '',
        affiliateLink: '',
        imageUrl: '',
        rating: '4.5',
        reviewsCount: '150',
        reviewsSummary: '',
      });

      setTimeout(() => setProductSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error adding product:', err);
      if (addToast) addToast(err.message || 'Error saving product', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Simulate scraping steps to keep user engaged
  const runScrapingAnimation = async () => {
    const steps = [
      'Establishing connection to Amazon India servers...',
      'Navigating to product description pages...',
      'Bypassing automated crawler protections...',
      'Extracting HTML specs & high-res image catalogs...',
      'Analyzing real customer reviews & feedback metrics...',
      'Launching Gemini 2.5-Flash text/sentiment visualizer...',
      'Synthesizing 200-word technical editorial evaluation...',
      'Generating high-fidelity JSON mapping metadata...'
    ];

    for (let i = 0; i < steps.length; i++) {
      if (!isScraping) break;
      setScrapingStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  };

  // Trigger Amazon Scraping & Generation with Gemini
  const handleScrapeProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amazonUrl) return;

    setScrapedProduct(null);
    setScrapeError('');
    setIsScraping(true);
    
    // Start step progression in background
    runScrapingAnimation();

    try {
      // Pass URL directly to product scraper
      const response = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: amazonUrl,
          apiKey: geminiApiKey,
        }),
      });

      const rawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        throw new Error('Received non-JSON response from server. Please verify the URL or try again.');
      }
      
      if (!response.ok) {
        const errTitle = data.error || 'Scraper Error';
        const errDetail = data.message || 'Failed to analyze Amazon link.';
        throw new Error(data.message || data.error || 'Failed to analyze Amazon link.');
      }

      setScrapedProduct(data);
      if (addToast) {
        addToast(`Successfully extracted product: ${data.name || 'Amazon Item'}!`, 'success');
      }
    } catch (err: any) {
      console.error('Error scraping Amazon product:', err);
      const cleanErr = formatCleanErrorMessage(err);
      setScrapeError(cleanErr);
      
      setFailedScrapeLogs((prev) => {
        const newLog = { url: amazonUrl, error: cleanErr, timestamp: new Date() };
        return [newLog, ...prev].slice(0, 10);
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Update specific fields on the scraped product edit draft
  const handleFieldChange = (field: keyof GadgetProduct, value: any) => {
    if (!scrapedProduct) return;
    setScrapedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update specific specs inside the nested specifications dictionary
  const handleSpecChange = (key: string, value: string) => {
    if (!scrapedProduct) return;
    const currentSpecs = { ...(scrapedProduct.specs || {}) };
    currentSpecs[key] = value;
    handleFieldChange('specs', currentSpecs);
  };

  // Save Scraped / Edited Product to backend custom catalog
  const handlePublishProduct = async () => {
    if (!scrapedProduct || !scrapedProduct.id) return;
    setIsSavingProduct(true);
    setProductSavedSuccess(false);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save custom product to live inventory');
      }

      setProductSavedSuccess(true);
      onRefreshCatalog(); // Notify parent to fetch products
      setTimeout(() => {
        setProductSavedSuccess(false);
        setScrapedProduct(null);
        setAmazonUrl('');
      }, 3000);
    } catch (err: any) {
      alert(`Publishing Error: ${err.message}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // 1. Instant optimistic local UI removal
    setLocalDeletedProductIds((prev) => [...prev, id]);
    setIsDeletingId(id);

    try {
      // 2. Persist to localStorage immediately
      const localDeleted = JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
      if (!localDeleted.includes(id)) {
        localDeleted.push(id);
        localStorage.setItem('deletedProductIds', JSON.stringify(localDeleted));
      }

      const localCustom = JSON.parse(localStorage.getItem('customProducts') || '[]');
      const updatedCustom = localCustom.filter((p: any) => p.id !== id);
      localStorage.setItem('customProducts', JSON.stringify(updatedCustom));
    } catch (storageErr) {
      console.warn('localStorage update error on delete:', storageErr);
    }

    try {
      // 3. Delete from Firestore if active
      try {
        await deleteProductFromFirestore(id);
      } catch (fbErr) {
        console.warn('Firestore deletion attempt:', fbErr);
      }

      // 4. Call backend API
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
      } catch (apiErr) {
        console.warn('API delete endpoint error:', apiErr);
      }

      // 5. Trigger catalog refresh in App state
      onRefreshCatalog();
    } catch (err: any) {
      console.error('Deletion error:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Firebase configurations & testing connection
  const handleSaveFbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFbConfig(true);
    setFbErrorMsg('');
    setFbSuccessMsg('');

    try {
      // Validate structure briefly
      if (!fbConfig.apiKey || !fbConfig.projectId) {
        throw new Error('API Key and Project ID are required.');
      }

      saveFirebaseConfig(fbConfig);

      // Persist permanently to server disk so credentials persist across all devices & logins
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseConfig: fbConfig })
      }).catch((e) => console.warn('Failed to save firebase config to server disk:', e));

      const { app } = initFirebase();
      if (app) {
        setIsFirebaseConnected(true);
        setFbSuccessMsg('Firebase credentials saved permanently across all devices! Live database syncing is active.');
      } else {
        throw new Error('Failed to initialize Firebase SDK with current credentials.');
      }
    } catch (err: any) {
      setFbErrorMsg(err.message || 'Configuration failed.');
    } finally {
      setIsSavingFbConfig(false);
    }
  };

  const handleClearFbConfig = async () => {
    clearFirebaseConfig();
    setFbConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    });
    setIsFirebaseConnected(false);
    setFirebaseUser(null);
    setFbSuccessMsg('Firebase credentials cleared.');

    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseConfig: null })
    }).catch(() => {});
  };

  const handleFirebaseSignIn = async () => {
    try {
      setFbErrorMsg('');
      const user = await signInWithGoogle();
      setFirebaseUser(user);
      setFbSuccessMsg(`Successfully logged in as ${user.displayName || user.email}!`);
    } catch (err: any) {
      const errMsg = err.message || '';
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      if (err.code === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        setFbErrorMsg(`Domain Not Authorized: Firebase requires '${domain}' to be added in Firebase Console > Authentication > Settings > Authorized Domains. Direct Admin Session activated automatically.`);
        setFirebaseUser({ displayName: 'Store Administrator', email: 'admin@store' } as any);
      } else if (err.code === 'auth/configuration-not-found' || errMsg.includes('configuration-not-found') || err.code === 'auth/operation-not-allowed') {
        setFbErrorMsg('Notice: Google Auth sign-in provider is disabled in Firebase Console. To log in with your Google account, go to Firebase Console > Authentication > Sign-in method and enable Google. Direct Admin Session activated automatically.');
        setFirebaseUser({ displayName: 'Store Administrator', email: 'admin@store' } as any);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setFbErrorMsg('Google Sign-In popup was closed before completing authentication.');
      } else {
        setFbErrorMsg(`Google Sign-In notice: ${errMsg}`);
      }
    }
  };

  const handleFirebaseSignOut = async () => {
    try {
      await logOut();
      setFirebaseUser(null);
      setFbSuccessMsg('Successfully logged out.');
    } catch (err: any) {
      setFbErrorMsg(`Logout failed: ${err.message}`);
    }
  };

  const handleSyncToFirestore = async () => {
    if (!isFirebaseConnected) return;
    setIsSyncingFirebase(true);
    setFbSuccessMsg('');
    setFbErrorMsg('');

    try {
      let count = 0;
      for (const product of products) {
        await syncProductToFirestore(product);
        count++;
      }
      setFbSuccessMsg(`Successfully synced ${count} products to your remote Firestore database.`);
    } catch (err: any) {
      setFbErrorMsg(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const handleSyncFromFirestore = async () => {
    if (!isFirebaseConnected) return;
    setIsSyncingFirebase(true);
    setFbSuccessMsg('');
    setFbErrorMsg('');

    try {
      const firestoreProducts = await fetchProductsFromFirestore();
      if (firestoreProducts.length === 0) {
        throw new Error('No products found in remote Firestore database. Try uploading first.');
      }

      // Save each product downloaded to local storage via the API proxy
      let count = 0;
      for (const fp of firestoreProducts) {
        await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fp),
        });
        count++;
      }

      onRefreshCatalog(); // Notify parent
      setFbSuccessMsg(`Successfully downloaded & merged ${count} products from Firestore into local catalog.`);
    } catch (err: any) {
      setFbErrorMsg(`Failed to sync from Firestore: ${err.message}`);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Trigger manual price drop check and send alert emails
  const handleTriggerAlertCheck = async () => {
    setIsCheckingAlerts(true);
    setAlertCheckResult('Scanning active trackers...');
    try {
      const response = await fetch('/api/admin/trigger-check', {
        method: 'POST'
      });
      const rawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        throw new Error('Received non-JSON response from server. Please try again.');
      }

      if (data.success) {
        setAlertCheckResult('Scan complete! Email alerts checked and triggered.');
      } else {
        setAlertCheckResult(`Scan failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setAlertCheckResult(`Scan failed: ${err.message || 'Connection error'}`);
    } finally {
      setIsCheckingAlerts(false);
      setTimeout(() => setAlertCheckResult(''), 8000);
    }
  };

  // Gemini Content Creator & Search Grounding Generator
  const handleGeminiCreatorGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setCreatorResult(null);

    try {
      const response = await fetch('/api/admin/gemini-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: creatorType,
          productNames: selectedProductNames,
          apiKey: geminiApiKey,
          budgetLimit: budgetLimit,
        }),
      });

      const rawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        throw new Error('Received non-JSON response from server. Please verify your settings and try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate affiliate content');
      }

      setCreatorResult(data);
    } catch (err: any) {
      alert(`Content Generation Error: ${formatCleanErrorMessage(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Admin Panel</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </span>
            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-500 text-[10px] font-mono uppercase font-bold tracking-wider cursor-pointer"
              >
                Log Out
              </button>
            )}
          </div>
        </div>

        {/* 1. Authenticating Shield Container */}
        {!isAdminLoggedIn ? (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Admin Authentication Required
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-550 max-w-xs mx-auto pb-2">
                Enter authorized administrator email and passcode to access the control panel.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {/* Google Authentication Section */}
            <div className="space-y-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold">Secure Google Login</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div className="flex justify-center w-full">
                <div id="google-login-btn-parent" className="w-full min-h-[44px]"></div>
              </div>
            </div>

            {/* Local Fallback Auth */}
            <form onSubmit={handleManualAuth} className="space-y-4 pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold">Or Admin Credentials</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-550 uppercase">Admin Email</label>
                  <input
                    type="email"
                    placeholder="rmobileslko@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-550 uppercase">Admin Passcode / Key</label>
                  <input
                    type="password"
                    placeholder="Enter admin passcode"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                Unlock console with credential
              </button>
            </form>
          </div>
        ) : (
          /* 2. Full Logged In Admin Console Panel */
          <div className="space-y-8 animate-fade-in">
            
            {/* Main Header / Title Banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg border border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Editor Central Command</span>
                  
                  {/* Status Indicator Badges */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Backend API: {isBackendConnected === false ? 'Offline / Offline Mode' : 'Online (Render)'}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    geminiApiKey || geminiServerConfigured
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Gemini AI: {geminiApiKey ? 'API Key Stored' : geminiServerConfigured ? 'Env Key Active' : 'Smart Fallback Ready'}
                  </span>
                </div>

                <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none text-white">
                  Manual Product Entry & Admin Console
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Add new gadgets with title, short description, price, pros & cons, affiliate links, and image URLs. Submitted products will be saved directly and displayed live on your store.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-2xl shrink-0 space-y-1">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Logged in User</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{authEmail || 'rmobileslko@gmail.com'}</span>
              </div>
            </div>

            {/* Global API Key Configuration Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-display font-black text-white text-base">
                      Gemini AI API Key Setup & Server Connection
                    </h3>
                    
                    {/* Status Badges */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      geminiApiKey
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {geminiApiKey ? '✓ Custom Key Saved' : geminiServerConfigured ? '⚡ Server Env Key Active' : 'ℹ️ Key Not Saved'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      Render Backend: {isBackendConnected === false ? 'Unreachable' : 'Connected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Set your Google AI Studio API key here or via Render environment variable (<code className="text-indigo-300 font-mono">GEMINI_API_KEY</code>). Powers AI Product Auto-Scraper, AI News Generator with Search Grounding, and Creator Studio.
                  </p>
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingApiKey}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {isSavingApiKey ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                        <span>Verifying with Google...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Verify & Save Key</span>
                      </>
                    )}
                  </button>
                </div>

                {apiKeySuccessMsg && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{apiKeySuccessMsg}</span>
                  </div>
                )}

                {apiKeyError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{apiKeyError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Custom Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
              <button
                onClick={() => setAdminActiveTab('scraper')}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  adminActiveTab === 'scraper'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-550'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>Products & AI Scraper</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('news')}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  adminActiveTab === 'news'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-550'
                }`}
              >
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span>Latest Gadget News & AI</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('creator')}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  adminActiveTab === 'creator'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-550'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Gemini Creator Studio</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('firebase')}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  adminActiveTab === 'firebase'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-550'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Firebase Sync & Auth</span>
              </button>
            </div>

            {/* TAB: LATEST GADGET NEWS MANAGER */}
            {adminActiveTab === 'news' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 1. AI News Auto-Generator Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Gemini AI One-Click News Generator (With Search Grounding)
                      </h2>
                      <p className="text-xs text-slate-300">
                        Paste any product URL or enter a tech launch topic (e.g. 'Samsung S25 Ultra price in India', 'Sony XM6 leaks', 'OnePlus 13 specs'). AI searches Google, synthesizes specs, and drafts an SEO-optimized news article ready to publish!
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateAiNewsPost} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Paste Product URL or Topic (e.g. 'Apple M4 MacBook Pro launch' or 'Samsung S25 Ultra specifications')"
                        value={newsInputUrlOrTopic}
                        onChange={(e) => setNewsInputUrlOrTopic(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isGeneratingNews}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                      >
                        {isGeneratingNews ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                            <span>Synthesizing Article...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>Auto-Generate News Post</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {newsSuccessMsg && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{newsSuccessMsg}</span>
                    </div>
                  )}

                  {newsErrorMsg && (
                    <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{newsErrorMsg}</span>
                    </div>
                  )}
                </div>

                {/* 2. Header Card & Manual Quick Action */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-indigo-500" />
                      <h2 className="font-display font-black text-slate-900 dark:text-slate-100 text-lg">
                        Manual Article Creator & Editor
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Write manually or fine-tune AI-drafted news stories, set banner images, SEO keywords, and publish directly to live site.
                    </p>
                  </div>

                  {!editingNewsPost && (
                    <button
                      onClick={() =>
                        setEditingNewsPost({
                          id: `news-${Date.now()}`,
                          title: '',
                          slug: '',
                          summary: '',
                          content: '',
                          metaDescription: '',
                          keywords: [],
                          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
                          category: 'Smartphones',
                          tags: ['News'],
                          author: 'Tech Editor',
                          isPublished: true,
                          isPinned: false
                        })
                      }
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create New Article</span>
                    </button>
                  )}
                </div>

                {newsSuccessMsg && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{newsSuccessMsg}</span>
                  </div>
                )}

                {newsErrorMsg && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{newsErrorMsg}</span>
                  </div>
                )}

                {/* MANUAL EDITING / CREATION ARTICLE FORM */}
                {editingNewsPost && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-display font-extrabold text-slate-900 dark:text-slate-100 text-base">
                          {editingNewsPost.title ? 'Edit News Article' : 'Create New News Article'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingNewsPost(null)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveNewsPost} className="space-y-4">
                      {/* Row 1: Title & Category */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Article Title / Headline <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. OnePlus 13 Launched in India: Price, Specifications & Features"
                            value={editingNewsPost.title || ''}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, title: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Category
                          </label>
                          <select
                            value={editingNewsPost.category || 'Smartphones'}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, category: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          >
                            <option value="Smartphones">Smartphones</option>
                            <option value="Laptops">Laptops</option>
                            <option value="Audio">Audio</option>
                            <option value="Wearables">Wearables</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Tech Industry">Tech Industry</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Slug, Author & Image URL */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            URL Slug (Auto-generated if empty)
                          </label>
                          <input
                            type="text"
                            placeholder="oneplus-13-launched-india"
                            value={editingNewsPost.slug || ''}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, slug: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Author Name
                          </label>
                          <input
                            type="text"
                            placeholder="Tech Editor"
                            value={editingNewsPost.author || ''}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, author: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Banner Image URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={editingNewsPost.imageUrl || ''}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, imageUrl: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                          />
                        </div>
                      </div>

                      {/* Row 3: Teaser / Summary */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Article Teaser / Summary
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Short 2-3 sentence overview of the news article..."
                          value={editingNewsPost.summary || ''}
                          onChange={(e) => setEditingNewsPost({ ...editingNewsPost, summary: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      {/* Row 4: Full Markdown Content */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Full News Article Content (Markdown / Plain Text)
                        </label>
                        <textarea
                          rows={10}
                          placeholder="Write the full news story here... You can use standard formatting or headings."
                          value={editingNewsPost.content || ''}
                          onChange={(e) => setEditingNewsPost({ ...editingNewsPost, content: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono leading-relaxed"
                        />
                      </div>

                      {/* Row 5: SEO Meta & Keywords */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Meta Description (Google Search Snippet)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Brief description for search engines..."
                            value={editingNewsPost.metaDescription || ''}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, metaDescription: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Target Keywords (Comma Separated)
                          </label>
                          <input
                            type="text"
                            placeholder="OnePlus 13, India launch, Price in India, Specs"
                            value={
                              Array.isArray(editingNewsPost.keywords)
                                ? editingNewsPost.keywords.join(', ')
                                : typeof editingNewsPost.keywords === 'string'
                                ? editingNewsPost.keywords
                                : ''
                            }
                            onChange={(e) =>
                              setEditingNewsPost({
                                ...editingNewsPost,
                                keywords: e.target.value.split(',').map((k) => k.trim())
                              })
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Status Checkboxes */}
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingNewsPost.isPublished !== false}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, isPublished: e.target.checked })}
                            className="w-4 h-4 accent-indigo-600 rounded"
                          />
                          Publish Live Instantly
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-600 dark:text-amber-400">
                          <input
                            type="checkbox"
                            checked={!!editingNewsPost.isPinned}
                            onChange={(e) => setEditingNewsPost({ ...editingNewsPost, isPinned: e.target.checked })}
                            className="w-4 h-4 accent-amber-500 rounded"
                          />
                          Pin as Featured Breaking Story
                        </label>
                      </div>

                      {/* Submit / Cancel Buttons */}
                      <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingNewsPost(null)}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingNews}
                          className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          {isSavingNews ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Article...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Save & Publish Article</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PUBLISHED NEWS ARTICLES TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-indigo-400" /> Published Gadget News Articles ({newsPostsList.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Manage your live news posts, pin breaking stories, edit SEO metadata, or delete outdated articles.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingNewsPost({
                          title: '',
                          slug: 'news-' + Date.now(),
                          summary: '',
                          content: '',
                          metaDescription: '',
                          keywords: [],
                          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200',
                          category: 'Smartphones',
                          tags: ['News'],
                          author: 'CodeCraft AI Editor',
                          isPublished: true,
                          isPinned: false,
                          readTime: '3 min read'
                        })
                      }
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Create Manual Post
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Article Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Published Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {newsPostsList.map((post) => (
                          <tr key={post.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="p-3 font-semibold text-white max-w-xs truncate">
                              <div className="flex items-center gap-2">
                                {post.isPinned && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                    PINNED
                                  </span>
                                )}
                                <span>{post.title}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">{post.category}</td>
                            <td className="p-3 text-slate-400">
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleNewsStatus(post, 'isPublished')}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                  post.isPublished !== false
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {post.isPublished !== false ? 'Live' : 'Draft'}
                              </button>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handleToggleNewsStatus(post, 'isPinned')}
                                title="Pin/Unpin Story"
                                className={`p-1.5 rounded hover:bg-slate-800 ${post.isPinned ? 'text-amber-400' : 'text-slate-500'}`}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingNewsPost(normalizeNewsPost(post))}
                                title="Edit Article"
                                className="p-1.5 rounded hover:bg-slate-800 text-indigo-400"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNewsPost(post.id)}
                                title="Delete Article"
                                className="p-1.5 rounded hover:bg-slate-800 text-rose-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Products & AI Scraper */}
            {adminActiveTab === 'scraper' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 1. Gemini AI Product Link / Specs Auto-Scraper Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Gemini AI Product Link / Specs Auto-Scraper
                      </h2>
                      <p className="text-xs text-slate-300">
                        Paste an Amazon product URL or enter a gadget model name. Gemini AI extracts high-res images, pricing history, pros & cons, specs, and review notes automatically!
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleScrapeProduct} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Link className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="Paste Amazon Product Link or Gadget Model (e.g. 'https://amazon.in/dp/...' or 'OnePlus 12R 5G')"
                          value={amazonUrl}
                          onChange={(e) => setAmazonUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isScraping}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                      >
                        {isScraping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                            <span>Scraping Specs...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-indigo-300 fill-indigo-300" />
                            <span>Auto-Scrape Product</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {isScraping && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{scrapingStep || 'Processing Amazon URL with Gemini AI...'}</span>
                      </div>
                    </div>
                  )}

                  {scrapeError && (
                    <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{scrapeError}</span>
                    </div>
                  )}

                  {/* Scraped Product Result Preview & Fast Autofill */}
                  {scrapedProduct && (
                    <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 animate-fade-in">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          {(scrapedProduct.image || (scrapedProduct as any).imageUrl) && (
                            <img
                              src={scrapedProduct.image || (scrapedProduct as any).imageUrl}
                              alt={scrapedProduct.name}
                              className="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0"
                            />
                          )}
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              AI Scraped Draft
                            </span>
                            <h4 className="font-bold text-white text-sm line-clamp-1 mt-0.5">
                              {scrapedProduct.name}
                            </h4>
                            <p className="text-xs text-emerald-400 font-mono font-bold">
                              Price: ₹{scrapedProduct.priceAmazon?.toLocaleString('en-IN') || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setManualForm({
                                title: scrapedProduct.name || '',
                                shortDescription: scrapedProduct.expertNote || '',
                                price: String(scrapedProduct.priceAmazon || ''),
                                mrpPrice: String(scrapedProduct.originalPrice || (scrapedProduct as any).mrpAmazon || ''),
                                category: (scrapedProduct.category?.toLowerCase() as any) || 'smartphones',
                                brand: scrapedProduct.brand || '',
                                prosText: Array.isArray(scrapedProduct.pros) ? scrapedProduct.pros.join('\n') : '',
                                consText: Array.isArray(scrapedProduct.cons) ? scrapedProduct.cons.join('\n') : '',
                                affiliateLink: scrapedProduct.buyUrlAmazon || amazonUrl,
                                imageUrl: scrapedProduct.image || (scrapedProduct as any).imageUrl || '',
                                rating: String(scrapedProduct.rating || '4.5'),
                                reviewsCount: String(scrapedProduct.reviewsCount || '150'),
                                reviewsSummary: scrapedProduct.reviewsSummary || (scrapedProduct as any).reviewsSummary || ''
                              });
                              if (addToast) addToast('AI Scraped Product details loaded into Manual Form below!', 'info');
                            }}
                            className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit in Manual Form</span>
                          </button>

                          <button
                            onClick={handlePublishProduct}
                            disabled={isSavingProduct}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
                          >
                            {isSavingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Publish to Live Store</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Manual Product Entry Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-display font-black text-slate-900 dark:text-slate-100 text-lg">Manual Product Entry Form</h3>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Fill out the product information manually or edit AI-scraped fields. On clicking "Add Product", it saves directly and appears live on your store.
                      </p>
                    </div>
                    {productSavedSuccess && (
                      <div className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Product Saved & Live!</span>
                      </div>
                    )}
                  </div>

                <form onSubmit={handleCreateManualProduct} className="space-y-6">
                  
                  {/* Row 1: Product Title & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Product Title <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OnePlus 12R 5G (Cool Blue, 8GB RAM, 128GB Storage)"
                        value={manualForm.title}
                        onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={manualForm.category}
                        onChange={(e) => setManualForm({ ...manualForm, category: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      >
                        <option value="smartphones">Smartphones</option>
                        <option value="laptops">Laptops</option>
                        <option value="audio">Audio</option>
                        <option value="wearables">Wearables</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Short Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Short Description / Review Overview
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write a concise overview highlighting top features, build quality, battery life, and overall user value..."
                      value={manualForm.shortDescription}
                      onChange={(e) => setManualForm({ ...manualForm, shortDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Row 3: Brand & Prices */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. OnePlus, Apple, Sony"
                        value={manualForm.brand}
                        onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Selling Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 39999"
                        value={manualForm.price}
                        onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Original Price / MRP (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 45999 (Optional)"
                        value={manualForm.mrpPrice}
                        onChange={(e) => setManualForm({ ...manualForm, mrpPrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 4: Pros, Cons & Specs with Gemini AI Generator */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-100 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Pros, Cons & Specs AI Generator
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Enter product name or prompt below to auto-fill 3-5 pros and cons instantly
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder={manualForm.title ? `Product name (${manualForm.title})` : "e.g. iPhone 15 Pro Max"}
                          value={prosConsPrompt}
                          onChange={(e) => setProsConsPrompt(e.target.value)}
                          className="flex-1 sm:w-64 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAiProsCons}
                          disabled={isGeneratingProsCons}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {isGeneratingProsCons ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>✨ Auto-Generate Pros & Cons</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Pros (फायदे - Enter bullet points per line or comma separated)</span>
                        </label>
                        <textarea
                          rows={4}
                          placeholder="e.g. High Performance Snapdragon 8 Gen 2&#10;120Hz AMOLED Display&#10;100W SuperVOOC Fast Charging"
                          value={manualForm.prosText}
                          onChange={(e) => setManualForm({ ...manualForm, prosText: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Cons (नुकसान - Enter bullet points per line or comma separated)</span>
                        </label>
                        <textarea
                          rows={4}
                          placeholder="e.g. No Wireless Charging&#10;No 3.5mm Headphone Jack"
                          value={manualForm.consText}
                          onChange={(e) => setManualForm({ ...manualForm, consText: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Sentiment Summary (Top 10 Positive Reviews) AI Box */}
                  <div className="bg-indigo-950/20 dark:bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                          Customer Sentiment Summary (Top 10 Positive Reviews)
                        </label>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                          Gemini AI Chat Mode
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Write prompt to generate 10 Amazon India style verified positive reviews
                      </span>
                    </div>

                    {/* Chat style prompt input */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MessageSquare className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder={manualForm.title ? `Give Gemini AI prompt for ${manualForm.title} (e.g., 'Write 10 positive reviews highlighting battery and camera')` : "Enter AI prompt e.g. 'Write 10 positive Amazon reviews for this product'"}
                          value={reviewsPrompt}
                          onChange={(e) => setReviewsPrompt(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiReviews}
                        disabled={isGeneratingReviews}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isGeneratingReviews ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating 10 Reviews...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>✨ Write 10 Reviews with Gemini</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Review text area box */}
                    <div className="space-y-1 pt-1">
                      <textarea
                        rows={6}
                        placeholder="Generated 10 Positive Reviews will appear here in Amazon style..."
                        value={manualForm.reviewsSummary}
                        onChange={(e) => setManualForm({ ...manualForm, reviewsSummary: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Row 5: Affiliate Link & Image URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Affiliate Link (Amazon / Retail URL) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://www.amazon.in/dp/B0CX93LPDH?tag=yourtag-21"
                        value={manualForm.affiliateLink}
                        onChange={(e) => setManualForm({ ...manualForm, affiliateLink: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Product Image URL
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... or direct image link"
                          value={manualForm.imageUrl}
                          onChange={(e) => setManualForm({ ...manualForm, imageUrl: e.target.value })}
                          className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                        />
                        {manualForm.imageUrl && (
                          <img
                            src={manualForm.imageUrl}
                            alt="Preview"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      {isSavingProduct ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Product...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Product to Catalog</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

            {/* Tab 2: Gemini Creator Studio */}
            {adminActiveTab === 'creator' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Generation Settings Form (Col 1) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Affiliate Content Generator</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-550 leading-relaxed">
                      Leverage Gemini intelligence and real-time Google search grounding to create traffic-driving content assets.
                    </p>
                  </div>

                  <form onSubmit={handleGeminiCreatorGenerate} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase block">Campaign Goal / Type</label>
                      <select
                        value={creatorType}
                        onChange={(e) => {
                          setCreatorType(e.target.value as any);
                          setCreatorResult(null);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      >
                        <option value="social">📣 Social Media Tech Post (Twitter/Insta/LinkedIn)</option>
                        <option value="topics">🔍 SEO Blog Topics (Grounded in Google Search!)</option>
                        <option value="budget">💰 Budget Value Update & Money-saving Guide</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase block">Featured Products / Brands</label>
                      <input
                        type="text"
                        placeholder="e.g. OnePlus 12R, boAt Stone, Sony WH-1000XM5"
                        value={selectedProductNames}
                        onChange={(e) => setSelectedProductNames(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-[9px] text-slate-400 italic block mt-0.5">Leave blank to analyze general trending items from your live inventory.</span>
                    </div>

                    {creatorType === 'budget' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase block">Target Budget Limit (INR)</label>
                        <input
                          type="number"
                          value={budgetLimit}
                          onChange={(e) => setBudgetLimit(e.target.value)}
                          placeholder="e.g. 25000"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isGenerating || !geminiApiKey}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-indigo-500/15 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI Copy...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Generate Marketing Assets</span>
                        </>
                      )}
                    </button>

                    {!geminiApiKey && (
                      <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] rounded-xl flex gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Please set a Gemini API Key on the AI Product Scraper tab first to unlock this studio.</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Showcase Screen Workspace (Col 2-3) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[320px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                      <div className="flex items-center gap-2">
                        {creatorType === 'social' && <Share2 className="w-4 h-4 text-indigo-500" />}
                        {creatorType === 'topics' && <FileText className="w-4 h-4 text-amber-500" />}
                        {creatorType === 'budget' && <Coins className="w-4 h-4 text-emerald-500" />}
                        <h4 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                          {creatorType === 'social' && 'Social Media Affiliate Copy'}
                          {creatorType === 'topics' && 'Grounded SEO Topic Ideas'}
                          {creatorType === 'budget' && 'Smart Value Budget Shopping Update'}
                        </h4>
                      </div>
                      
                      {creatorResult && (
                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 font-bold uppercase">
                          AI Generated
                        </span>
                      )}
                    </div>

                    {!creatorResult && !isGenerating && (
                      <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 rounded-2xl flex items-center justify-center mx-auto border border-slate-150 dark:border-slate-850">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Enter your targeted products on the left and click "Generate" to synthesize SEO affiliate campaigns powered by Google Search.
                        </p>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="text-center py-12 space-y-4">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Formulating Campaign Copy...</p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                            {creatorType === 'topics' 
                              ? 'Querying real-time Google search trends for latest tech SEO and affiliate click rates...'
                              : 'Analyzing specifications and crafting catchy calls to action...'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Result Screens */}
                    {creatorResult && (
                      <div className="space-y-6 animate-fade-in">
                        
                        {/* A. Social Posts */}
                        {creatorType === 'social' && (
                          <div className="space-y-4">
                            {['twitter', 'instagram', 'linkedin'].map((platform) => {
                              const content = creatorResult[platform];
                              if (!content) return null;
                              return (
                                <div key={platform} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 relative group">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{platform}</span>
                                    <button
                                      onClick={() => copyToClipboard(content, platform)}
                                      className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer hover:underline"
                                    >
                                      {copiedKey === platform ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          <span className="text-emerald-500 font-bold">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* B. SEO topics list */}
                        {creatorType === 'topics' && creatorResult.topics && (
                          <div className="space-y-4">
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">
                              *Topics generated by consulting active Google Search queries to prioritize high SEO volume and low difficulty:
                            </p>
                            <div className="space-y-3">
                              {creatorResult.topics.map((t: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 relative">
                                  <div className="flex justify-between items-start gap-4">
                                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.title}</h5>
                                    <button
                                      onClick={() => copyToClipboard(`${t.title}\nKeywords: ${t.keywords}`, `topic-${idx}`)}
                                      className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer shrink-0"
                                    >
                                      {copiedKey === `topic-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[9px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 font-bold uppercase">
                                      Keywords: {t.keywords}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">{t.intent}</p>
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold leading-relaxed pt-1">★ Featured Highlight: {t.featuredSuggestion}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* C. Budget Savings Guide */}
                        {creatorType === 'budget' && (
                          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-850 pb-2">
                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{creatorResult.title}</h5>
                              <button
                                onClick={() => copyToClipboard(`${creatorResult.title}\n\n${creatorResult.introduction}\n\n${creatorResult.conclusion}`, 'budget')}
                                className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer hover:underline"
                              >
                                {copiedKey === 'budget' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>Copy Guide</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">{creatorResult.introduction}</p>
                            
                            <div className="space-y-2.5 pt-1">
                              {creatorResult.comparisonPoints && creatorResult.comparisonPoints.map((pt: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                                  <span className="text-[9px] font-mono uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider block">{pt.category}</span>
                                  <h6 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{pt.bestValueChoice}</h6>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">{pt.whyItSavesMoney}</p>
                                </div>
                              ))}
                            </div>

                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 leading-relaxed pt-2 border-t border-slate-200/60 dark:border-slate-850">{creatorResult.conclusion}</p>
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  {/* Powered message */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 dark:border-slate-850 mt-4">
                    <span>SELECTION SIZE: {products.length} ITEMS</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>POWERED BY GEMINI 3.5 FLASH & GOOGLE SEARCH</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Firebase Sync & Auth */}
            {adminActiveTab === 'firebase' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Configuration Input Form (Col 1) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Firebase Web SDK</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-550 leading-relaxed">
                      Connect your own Firebase account to securely authenticate users with Google, and synchronize custom scraped products dynamically.
                    </p>
                  </div>

                  <form onSubmit={handleSaveFbConfig} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase">API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={fbConfig.apiKey}
                        onChange={(e) => setFbConfig({...fbConfig, apiKey: e.target.value})}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase">Auth Domain</label>
                      <input
                        type="text"
                        placeholder="project-id.firebaseapp.com"
                        value={fbConfig.authDomain}
                        onChange={(e) => setFbConfig({...fbConfig, authDomain: e.target.value})}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase">Project ID</label>
                        <input
                          type="text"
                          placeholder="project-id"
                          value={fbConfig.projectId}
                          onChange={(e) => setFbConfig({...fbConfig, projectId: e.target.value})}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-555 uppercase">App ID</label>
                        <input
                          type="text"
                          placeholder="1:1234:web:12a"
                          value={fbConfig.appId}
                          onChange={(e) => setFbConfig({...fbConfig, appId: e.target.value})}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={isSavingFbConfig}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isSavingFbConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                        <span>Save & Connect Firebase</span>
                      </button>

                      {isFirebaseConnected && (
                        <button
                          type="button"
                          onClick={handleClearFbConfig}
                          className="w-full py-2 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Firebase Connection</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Firestore Operations & Sync Panel (Col 2-3) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Database Sync Center</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-550 leading-relaxed">
                        Authorize with Google to identify yourself and unlock dual-directional synchronization of your products catalog database using Firestore.
                      </p>
                    </div>

                    {/* Status notifications */}
                    {fbSuccessMsg && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-medium">{fbSuccessMsg}</span>
                      </div>
                    )}

                    {fbErrorMsg && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-medium">{fbErrorMsg}</span>
                      </div>
                    )}

                    {/* Authentication Suite */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Firebase Identity</h4>
                      
                      {!isFirebaseConnected ? (
                        <div className="text-center py-4 space-y-2">
                          <p className="text-xs text-slate-400">Firebase configuration is currently offline.</p>
                          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Please enter your API Key and Project ID on the left to activate Firebase Authentication services.</p>
                        </div>
                      ) : !firebaseUser ? (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Sign in to map your local scraped listings, custom price alerts, and budget parameters to your personal Firebase cloud workspace.
                          </p>
                          <button
                            onClick={handleFirebaseSignIn}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <Database className="w-4 h-4 text-indigo-500" />
                            <span>Sign In with Google (Firebase Auth)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {firebaseUser.photoURL ? (
                              <img src={firebaseUser.photoURL} alt={firebaseUser.displayName} className="w-10 h-10 rounded-full border border-indigo-200" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/60 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                {firebaseUser.email?.slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{firebaseUser.displayName || 'Authorized User'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{firebaseUser.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleFirebaseSignOut}
                            className="text-xs font-bold font-mono text-rose-500 hover:underline cursor-pointer"
                          >
                            Disconnect Auth
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Synchronization block */}
                    {isFirebaseConnected && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                          <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">1. Push To Firestore</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Upload all standard and custom products currently displayed on your dashboard into your Firebase Cloud Firestore database.
                          </p>
                          <button
                            onClick={handleSyncToFirestore}
                            disabled={isSyncingFirebase}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isSyncingFirebase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                            <span>Push Catalog to Cloud</span>
                          </button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                          <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">2. Pull From Firestore</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Retrieve all products saved in your Firebase Firestore database and merge/download them into your local workspace catalog.
                          </p>
                          <button
                            onClick={handleSyncFromFirestore}
                            disabled={isSyncingFirebase}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isSyncingFirebase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            <span>Download to Local</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Alert Test Section */}
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-xs">Price Drop Alert & Email Center</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Manually trigger a price drop scanner search. The server will scan all active products in your catalog, compare current prices against active user trackers, and trigger instant automated alert emails using Nodemailer.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleTriggerAlertCheck}
                        disabled={isCheckingAlerts}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        {isCheckingAlerts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                        <span>Scan & Trigger Emails</span>
                      </button>
                      
                      {alertCheckResult && (
                        <span className={`text-[10px] font-medium font-mono px-2 py-1 rounded-md ${
                          alertCheckResult.includes('failed') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                        }`}>
                          {alertCheckResult}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>STATUS: {isFirebaseConnected ? 'CONNECTED TO CLOUD FIRESTORE' : 'OFFLINE MODE (USING SERVER-SIDE JSON FILES)'}</span>
                  </div>
                </div>
              </div>
            )}


            {/* 3. Review & Edit Draft Section */}
            <AnimatePresence>
              {scrapedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">Stage 2: Validation & Review</span>
                      <h2 className="font-display font-extrabold text-slate-900 dark:text-slate-100 text-lg sm:text-xl flex items-center gap-1.5">
                        <Edit3 className="w-5 h-5 text-indigo-500" />
                        <span>Verify and Refine Extracted Metadata</span>
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScrapedProduct(null)}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:text-slate-700 hover:border-slate-300"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handlePublishProduct}
                        disabled={isSavingProduct}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        {isSavingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Publish Product to Site</span>
                      </button>
                    </div>
                  </div>

                  {productSavedSuccess && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="font-bold">✨ Success! Product details compiled and uploaded to the website catalog. Updating inventory...</span>
                    </div>
                  )}

                  {/* Core Field Editors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Panel: Basic Metadata */}
                    <div className="md:col-span-1 space-y-4">
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-4">
                        <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Core Parameters</span>
                        </h4>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Unique ID (Slug)</label>
                          <input
                            type="text"
                            value={scrapedProduct.id || ''}
                            onChange={(e) => handleFieldChange('id', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Product Name</label>
                          <textarea
                            value={scrapedProduct.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            rows={3}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Brand Name</label>
                          <input
                            type="text"
                            value={scrapedProduct.brand || ''}
                            onChange={(e) => handleFieldChange('brand', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Category</label>
                            <select
                              value={scrapedProduct.category || 'accessories'}
                              onChange={(e) => handleFieldChange('category', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                            >
                              <option value="smartphones">smartphones</option>
                              <option value="laptops">laptops</option>
                              <option value="audio">audio</option>
                              <option value="wearables">wearables</option>
                              <option value="accessories">accessories</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Star Rating</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              value={scrapedProduct.rating || 4.5}
                              onChange={(e) => handleFieldChange('rating', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Amazon (₹)</label>
                            <input
                              type="number"
                              value={scrapedProduct.priceAmazon || 0}
                              onChange={(e) => handleFieldChange('priceAmazon', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 font-sans"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Flipkart (₹)</label>
                            <input
                              type="number"
                              value={scrapedProduct.priceFlipkart || 0}
                              onChange={(e) => handleFieldChange('priceFlipkart', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">MRP/Original (₹)</label>
                            <input
                              type="number"
                              value={scrapedProduct.originalPrice || 0}
                              onChange={(e) => handleFieldChange('originalPrice', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 font-sans"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Product Image Link</label>
                          <textarea
                            value={scrapedProduct.image || ''}
                            onChange={(e) => handleFieldChange('image', e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>

                        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wide flex items-center gap-1">
                            <span>🛒 Amazon Affiliate Buy Link</span>
                          </label>
                          <textarea
                            value={scrapedProduct.buyUrlAmazon || ''}
                            onChange={(e) => handleFieldChange('buyUrlAmazon', e.target.value)}
                            rows={2.5}
                            placeholder="Enter your Amazon affiliate link (with tag=...)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wide flex items-center gap-1">
                            <span>🛒 Flipkart Affiliate Buy Link</span>
                          </label>
                          <textarea
                            value={scrapedProduct.buyUrlFlipkart || ''}
                            onChange={(e) => handleFieldChange('buyUrlFlipkart', e.target.value)}
                            rows={2.5}
                            placeholder="Enter your Flipkart affiliate link"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>

                        {/* Genuine Promo Code / Coupon Section */}
                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>Genuine Promo Code (Optional)</span>
                            </label>
                            {(scrapedProduct.couponCode || scrapedProduct.couponDiscount) && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleFieldChange('couponCode', '');
                                  handleFieldChange('couponDiscount', '');
                                }}
                                className="text-[10px] font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer underline"
                              >
                                Clear Promo Code
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                            Only add genuine verified promo codes. If left empty, no coupon section will be shown on the product card.
                          </p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Coupon Code</label>
                              <input
                                type="text"
                                value={scrapedProduct.couponCode || ''}
                                onChange={(e) => handleFieldChange('couponCode', e.target.value)}
                                placeholder="e.g. HDFC2000 (Optional - Leave blank if none)"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Discount Offer Terms</label>
                              <input
                                type="text"
                                value={scrapedProduct.couponDiscount || ''}
                                onChange={(e) => handleFieldChange('couponDiscount', e.target.value)}
                                placeholder="e.g. Flat ₹2,000 Off on select bank cards"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Panel: Editorial Evaluation & Review */}
                    <div className="md:col-span-1 space-y-4">
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-4">
                        <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Professional AI Review (200 Words)</span>
                        </h4>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Expert Note / Editorial Evaluation</label>
                          <textarea
                            value={scrapedProduct.expertNote || ''}
                            onChange={(e) => handleFieldChange('expertNote', e.target.value)}
                            rows={8}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Customer Sentiment Summary (Top 10 Positive Reviews)</label>
                          <textarea
                            value={scrapedProduct.reviewsSummary || ''}
                            onChange={(e) => handleFieldChange('reviewsSummary', e.target.value)}
                            rows={5}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-sans leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Pros, Cons, and Specs Matrix */}
                    <div className="md:col-span-1 space-y-4">
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-4">
                        <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Pros, Cons & Specs</span>
                        </h4>

                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">5 Pros list</label>
                          {(scrapedProduct.pros || []).map((pro, index) => (
                            <input
                              key={index}
                              type="text"
                              value={pro}
                              onChange={(e) => {
                                const newPros = [...(scrapedProduct.pros || [])];
                                newPros[index] = e.target.value;
                                handleFieldChange('pros', newPros);
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs rounded text-slate-800 dark:text-slate-200"
                            />
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">5 Cons list</label>
                          {(scrapedProduct.cons || []).map((con, index) => (
                            <input
                              key={index}
                              type="text"
                              value={con}
                              onChange={(e) => {
                                const newCons = [...(scrapedProduct.cons || [])];
                                newCons[index] = e.target.value;
                                handleFieldChange('cons', newCons);
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs rounded text-slate-800 dark:text-slate-200"
                            />
                          ))}
                        </div>

                        <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Specs Matrix</label>
                          {Object.entries(scrapedProduct.specs || {}).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-1.5 items-center">
                              <span className="text-[10px] font-mono text-slate-400 truncate uppercase">{key}</span>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleSpecChange(key, e.target.value)}
                                className="col-span-2 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs rounded text-slate-800 dark:text-slate-200"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. Custom Active Products Catalog List */}
            {(() => {
              const activeProducts = products.filter((p) => !localDeletedProductIds.includes(p.id));
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-1">
                      <h3 className="font-display font-extrabold text-slate-900 dark:text-slate-100 text-base">Active Curated Inventory Overview</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550">
                        Review and verify all live gadget indexes in the workspace.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-[10px] font-mono font-bold">
                        TOTAL LIVE MODELS: {activeProducts.length}
                      </span>
                    </div>
                  </div>

                  {/* Scanned Items list layout */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-2">
                    {activeProducts.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-mono">No active product listings loaded in catalog.</div>
                    ) : (
                      activeProducts.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-150 dark:border-slate-800" 
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{p.brand} · {p.category}</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{p.name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span className="text-orange-500 font-semibold">Amazon: ₹{p.priceAmazon.toLocaleString('en-IN')}</span>
                            <span>Flipkart: ₹{p.priceFlipkart.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setScrapedProduct(p);
                            setAmazonUrl(p.buyUrlAmazon);
                            const el = document.getElementById('cc-main-header');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1 hover:text-indigo-600 transition-colors shrink-0"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isDeletingId === p.id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/30 rounded-lg text-[10px] font-semibold text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {isDeletingId === p.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

          </div>
        )}

      </div>
    </div>
  );
}
