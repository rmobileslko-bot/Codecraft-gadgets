import { GadgetProduct } from './types';

// Preloaded mock/demo products array is completely empty by default.
// Only user-uploaded/scraped products will appear in the catalog.
export const GADGETS_DATA: GadgetProduct[] = [];

export const CATEGORIES = [
  { id: 'all', label: 'All Gadgets', icon: 'Sparkles' },
  { id: 'smartphones', label: 'Smartphones', icon: 'Smartphone' },
  { id: 'laptops', label: 'Laptops', icon: 'Laptop' },
  { id: 'audio', label: 'Audio & Music', icon: 'Headphones' },
  { id: 'wearables', label: 'Wearables', icon: 'Watch' },
  { id: 'accessories', label: 'Accessories', icon: 'Keyboard' }
];

export const SAVED_COUPONS: any[] = [];
