import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, Newspaper, Calendar, Clock, Tag, ExternalLink, 
  ChevronRight, ArrowLeft, Share2, Check, Filter, Zap, Bookmark, 
  Cpu, ThumbsUp, ThumbsDown, Award, Globe, MessageSquare, ChevronLeft
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GadgetNewsPost } from '../types';

interface LatestNewsViewProps {
  onSelectCategory?: (category: string) => void;
  onSelectProduct?: (productId: string) => void;
  onOpenAdmin?: () => void;
}

// Social Media Share Bar Component
const SocialShareButtons: React.FC<{
  post: GadgetNewsPost;
  copiedId?: string | null;
  onCopy?: (post: GadgetNewsPost, e: React.MouseEvent) => void;
  variant?: 'compact' | 'full';
}> = ({ post, copiedId, onCopy, variant = 'full' }) => {
  const isCopied = copiedId === post.id;
  const articleUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?page=news&article=${encodeURIComponent(post.slug || post.id)}`
    : '';

  const handleTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out: "${post.title}" on CodeCraft AI`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(articleUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🔥 ${post.title}\n\nRead full story: ${articleUrl}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600,noopener,noreferrer');
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(post, e);
    } else {
      navigator.clipboard.writeText(articleUrl);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleTwitter}
          title="Share on X (Twitter)"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          title="Share on WhatsApp"
          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-800/50 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.689-.834-1.951-.929-.262-.095-.453-.143-.644.143-.191.285-.74.929-.907 1.119-.168.19-.334.214-.619.071-.285-.143-1.204-.444-2.293-1.415-.848-.756-1.42-1.69-1.587-1.975-.167-.285-.018-.439.125-.581.128-.128.285-.333.428-.5.143-.167.19-.285.285-.476.095-.19.048-.357-.024-.5-.071-.143-.644-1.552-.882-2.124-.232-.557-.468-.482-.644-.491l-.549-.01c-.19 0-.5.071-.762.357-.262.285-1.001.977-1.001 2.38 0 1.403 1.024 2.759 1.167 2.95.143.19 2.016 3.078 4.884 4.318.682.295 1.215.471 1.63.603.686.218 1.31.187 1.803.113.549-.083 1.689-.69 1.927-1.356.238-.666.238-1.237.167-1.356-.07-.119-.261-.19-.546-.333z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={handleLinkedIn}
          title="Share on LinkedIn"
          className="p-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-400 hover:text-sky-300 transition-all border border-sky-800/50 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          title="Copy Link"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Share Story:
      </span>

      {/* Twitter / X Button */}
      <button
        type="button"
        onClick={handleTwitter}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700/80 shadow-xs cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 fill-current text-slate-200" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span>X (Twitter)</span>
      </button>

      {/* WhatsApp Button */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all border border-emerald-700/60 shadow-xs cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.689-.834-1.951-.929-.262-.095-.453-.143-.644.143-.191.285-.74.929-.907 1.119-.168.19-.334.214-.619.071-.285-.143-1.204-.444-2.293-1.415-.848-.756-1.42-1.69-1.587-1.975-.167-.285-.018-.439.125-.581.128-.128.285-.333.428-.5.143-.167.19-.285.285-.476.095-.19.048-.357-.024-.5-.071-.143-.644-1.552-.882-2.124-.232-.557-.468-.482-.644-.491l-.549-.01c-.19 0-.5.071-.762.357-.262.285-1.001.977-1.001 2.38 0 1.403 1.024 2.759 1.167 2.95.143.19 2.016 3.078 4.884 4.318.682.295 1.215.471 1.63.603.686.218 1.31.187 1.803.113.549-.083 1.689-.69 1.927-1.356.238-.666.238-1.237.167-1.356-.07-.119-.261-.19-.546-.333z"/>
        </svg>
        <span>WhatsApp</span>
      </button>

      {/* LinkedIn Button */}
      <button
        type="button"
        onClick={handleLinkedIn}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-sky-200 text-xs font-semibold transition-all border border-sky-700/60 shadow-xs cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 fill-current text-sky-400" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
        <span>LinkedIn</span>
      </button>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
      >
        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
};

export const LatestNewsView: React.FC<LatestNewsViewProps> = ({ onSelectCategory, onSelectProduct, onOpenAdmin }) => {
  const [posts, setPosts] = useState<GadgetNewsPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<GadgetNewsPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const categories = ['All', 'Smartphones', 'Laptops', 'Audio', 'Wearables', 'Gaming', 'Tech Industry'];

  useEffect(() => {
    // Check if URL has ?article=slug parameter
    const params = new URLSearchParams(window.location.search);
    const articleParam = params.get('article');
    if (articleParam) {
      fetchSingleArticle(articleParam);
    }
    fetchNews(page, selectedCategory, searchQuery);
  }, [page, selectedCategory]);

  const fetchSingleArticle = async (slugOrId: string) => {
    try {
      const res = await fetch(`/api/news?search=${encodeURIComponent(slugOrId)}`);
      if (res.ok) {
        const data = await res.json();
        const found = data.posts?.find((p: GadgetNewsPost) => p.slug === slugOrId || p.id === slugOrId);
        if (found) {
          setSelectedPost(found);
        }
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    }
  };

  const fetchNews = async (pageNum: number, category: string, search: string) => {
    setLoading(true);
    try {
      let url = `/api/news?page=${pageNum}&limit=10`;
      if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
      if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      let fetchedPosts: GadgetNewsPost[] = [];
      let totalP = 1;
      let totalC = 0;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        fetchedPosts = data.posts || [];
        totalP = data.totalPages || 1;
        totalC = data.totalCount || 0;
      }

      // Merge with custom posts from localStorage if any
      try {
        const localCustom: GadgetNewsPost[] = JSON.parse(localStorage.getItem('gadgetNewsPosts') || '[]');
        if (localCustom.length > 0) {
          const existingIds = new Set(fetchedPosts.map((p) => p.id));
          const matchingLocal = localCustom.filter((p) => {
            if (existingIds.has(p.id)) return false;
            if (category && category !== 'All' && p.category !== category) return false;
            if (search && search.trim()) {
              const q = search.toLowerCase();
              return p.title.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q);
            }
            return true;
          });
          fetchedPosts = [...matchingLocal, ...fetchedPosts];
          totalC += matchingLocal.length;
        }
      } catch (e) {
        console.warn('LocalStorage news merge warning:', e);
      }

      setPosts(fetchedPosts);
      setTotalPages(totalP);
      setTotalCount(totalC);
    } catch (err) {
      console.error('Failed to load news posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNews(1, selectedCategory, searchQuery);
  };

  const handleArticleClick = (post: GadgetNewsPost) => {
    setSelectedPost(post);
    // Update URL query state gracefully without full page reload
    const newUrl = `${window.location.pathname}?page=news&article=${encodeURIComponent(post.slug || post.id)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    const newUrl = `${window.location.pathname}?page=news`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const handleCopyPostLink = (post: GadgetNewsPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const articleUrl = `${window.location.origin}${window.location.pathname}?page=news&article=${encodeURIComponent(post.slug || post.id)}`;
    navigator.clipboard.writeText(articleUrl);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  const handleShareArticle = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Pinned/Featured post
  const featuredPost = posts.find((p) => p.isPinned) || posts[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* HEADER HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border-b border-slate-800/80 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          {selectedPost ? (
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all text-sm font-medium mb-6 border border-slate-700/60 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Gadget News
            </button>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> AI-Managed News & Launch Leaks
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                  Latest Gadget <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">News</span>
                </h1>
                <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
                  Real-time tech announcements, smartphone launches, specifications leaks, and expert AI-synthesized product breakdowns.
                </p>
              </div>

              {/* Quick Admin Trigger button */}
              {onOpenAdmin && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 border border-indigo-400/30"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Auto-Create Post with AI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* ARTICLE DETAIL VIEW */}
        {selectedPost ? (
          <article className="max-w-4xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Cover Image Header */}
            <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-slate-950">
              <img
                src={selectedPost.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200'}
                alt={selectedPost.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md">
                    {selectedPost.category}
                  </span>
                  {selectedPost.isPinned && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                      <Bookmark className="w-3 h-3 fill-slate-950" /> Featured Breaking
                    </span>
                  )}
                </div>
                <div className="bg-slate-950/80 p-1 rounded-xl backdrop-blur-md border border-slate-800/80">
                  <SocialShareButtons
                    post={selectedPost}
                    copiedId={copiedPostId}
                    onCopy={handleCopyPostLink}
                    variant="compact"
                  />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                  {selectedPost.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mt-3 font-medium">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> {selectedPost.author || 'CodeCraft AI Editor'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" /> {new Date(selectedPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" /> {selectedPost.readTime || '3 min read'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-10 space-y-8">
              {/* Summary lead */}
              <div className="p-5 rounded-xl bg-indigo-950/40 border-l-4 border-indigo-500 text-slate-200 text-base sm:text-lg leading-relaxed font-medium italic">
                "{selectedPost.summary}"
              </div>

              {/* Main Markdown Content */}
              <div className="prose prose-invert prose-indigo max-w-none text-slate-300 space-y-4 text-base sm:text-lg leading-relaxed">
                <Markdown>{selectedPost.content}</Markdown>
              </div>

              {/* Specifications Box if present */}
              {selectedPost.productSpecs && Object.keys(selectedPost.productSpecs).length > 0 && (
                <div className="mt-8 p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-indigo-400" /> Key Specs at a Glance
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {Object.entries(selectedPost.productSpecs).map(([specKey, specVal]) => (
                      <div key={specKey} className="flex justify-between items-center p-3 rounded-lg bg-slate-900/90 border border-slate-800/60">
                        <span className="text-slate-400 font-medium">{specKey}</span>
                        <span className="text-white font-semibold text-right">{specVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros & Cons Grid */}
              {((selectedPost.pros && selectedPost.pros.length > 0) || (selectedPost.cons && selectedPost.cons.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {selectedPost.pros && selectedPost.pros.length > 0 && (
                    <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                      <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                        <ThumbsUp className="w-4 h-4" /> Major Upgrades & Pros
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {selectedPost.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPost.cons && selectedPost.cons.length > 0 && (
                    <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-800/40">
                      <h4 className="text-rose-400 font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                        <ThumbsDown className="w-4 h-4" /> Drawbacks & Cons
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {selectedPost.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Editor Verdict */}
              {selectedPost.verdict && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30">
                  <h4 className="text-indigo-300 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                    <Award className="w-4 h-4 text-indigo-400" /> AI Editor Verdict
                  </h4>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{selectedPost.verdict}</p>
                </div>
              )}

              {/* Product link button if available */}
              {selectedPost.productUrl && (
                <div className="pt-4 flex flex-wrap gap-4">
                  <a
                    href={selectedPost.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    View Official Product Page <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Tags & Share Footer */}
              <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500" />
                  {Array.isArray(selectedPost.tags) ? selectedPost.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
                      #{tag}
                    </span>
                  )) : (typeof selectedPost.tags === 'string' ? (
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
                      #{selectedPost.tags}
                    </span>
                  ) : null)}
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                  <SocialShareButtons
                    post={selectedPost}
                    copiedId={copiedPostId}
                    onCopy={handleCopyPostLink}
                    variant="full"
                  />
                </div>
              </div>

              {/* SEO Meta Information Card for Transparency */}
              <div className="mt-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5" /> Google Search Console & SEO Optimization Info
                </div>
                <p><strong className="text-slate-300">Meta Description:</strong> {selectedPost.metaDescription}</p>
                <p><strong className="text-slate-300">Target SEO Keywords:</strong> {
                  Array.isArray(selectedPost.keywords)
                    ? selectedPost.keywords.join(', ')
                    : (typeof selectedPost.keywords === 'string' ? selectedPost.keywords : '')
                }</p>
              </div>
            </div>
          </article>
        ) : (
          /* NEWS LIST VIEW */
          <div className="space-y-8">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search gadget news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </form>
            </div>

            {/* FEATURED BREAKING NEWS CARD */}
            {featuredPost && selectedCategory === 'All' && !searchQuery && page === 1 && (
              <div 
                onClick={() => handleArticleClick(featuredPost)}
                className="group cursor-pointer rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 overflow-hidden shadow-2xl hover:border-indigo-500/60 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0"
              >
                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 fill-amber-300" /> Featured Breaking
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime || '3 min read'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="mt-3 text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
                      {featuredPost.summary}
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <SocialShareButtons
                        post={featuredPost}
                        copiedId={copiedPostId}
                        onCopy={handleCopyPostLink}
                        variant="compact"
                      />
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                        Read Full Article <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 relative min-h-[220px] md:min-h-full overflow-hidden bg-slate-950">
                  <img
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent opacity-80" />
                </div>
              </div>
            )}

            {/* ARTICLES GRID */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8">
                <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No News Articles Found</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  Try adjusting your search query or selecting a different tech category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => handleArticleClick(post)}
                    className="group cursor-pointer rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1"
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                        <img
                          src={post.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200'}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <span className="px-2.5 py-1 rounded-md bg-slate-950/80 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 backdrop-blur-md">
                            {post.category}
                          </span>
                          <div className="bg-slate-950/80 p-1 rounded-lg backdrop-blur-md border border-slate-800/80">
                            <SocialShareButtons
                              post={post}
                              copiedId={copiedPostId}
                              onCopy={handleCopyPostLink}
                              variant="compact"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span>•</span>
                          <Clock className="w-3 h-3 text-slate-500" />
                          {post.readTime || '3 min read'}
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>
                    </div>

                    {/* Footer link */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                      <span>Read Story</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestNewsView;
