export interface PricePoint {
  date: string;
  amazon: number;
  flipkart: number;
}

export interface GadgetProduct {
  id: string;
  name: string;
  category: 'smartphones' | 'laptops' | 'audio' | 'wearables' | 'accessories';
  brand: string;
  priceAmazon: number;
  priceFlipkart: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewsCount: number;
  expertNote: string;
  pros: string[];
  cons: string[];
  specs: Record<string, string>;
  isTrending: boolean;
  priceHistory: PricePoint[];
  buyUrlAmazon: string;
  buyUrlFlipkart: string;
  couponCode?: string;
  couponDiscount?: string;
  specHighlights: string[];
  reviewsSummary?: string;
  userFeedbacks?: {
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  email: string;
  store: 'amazon' | 'flipkart';
  status: 'active' | 'triggered';
}

export interface GadgetNewsPost {
  id: string;
  title: string;
  slug: string;
  productUrl?: string;
  summary: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  imageUrl: string;
  category: 'Smartphones' | 'Laptops' | 'Audio' | 'Wearables' | 'Gaming' | 'Tech Industry';
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isPublished: boolean;
  readTime: string;
  productSpecs?: Record<string, string>;
  pros?: string[];
  cons?: string[];
  verdict?: string;
  viewsCount?: number;
}
