import { GADGETS_DATA, CATEGORIES, SAVED_COUPONS } from '../data';
import { TRANSLATIONS_DATA } from '../translations_data';
import { GadgetProduct } from '../types';

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Coupon {
  code: string;
  discount: string;
  minAmount: number;
  description: string;
}

export function getLocalizedProducts(products: GadgetProduct[], lang: string): GadgetProduct[] {
  // If the language is english or translations are not available, return the default data
  const translations = TRANSLATIONS_DATA[lang];
  if (!translations || !translations.products) {
    return products;
  }

  return products.map(prod => {
    const trans = translations.products[prod.id];
    if (!trans) return prod;

    // Localize spec values (leaving keys as are, since they are standard label headers like 'OS', 'Weight', etc. translated separately or standard)
    const localizedSpecs = { ...prod.specs };
    if (trans.specs) {
      Object.keys(prod.specs).forEach(key => {
        if (trans.specs[key]) {
          localizedSpecs[key] = trans.specs[key];
        }
      });
    }

    return {
      ...prod,
      name: trans.name || prod.name,
      expertNote: trans.expertNote || prod.expertNote,
      pros: trans.pros || prod.pros,
      cons: trans.cons || prod.cons,
      specs: localizedSpecs,
      specHighlights: trans.specHighlights || prod.specHighlights,
    };
  });
}

export function getLocalizedCoupons(coupons: Coupon[], lang: string): Coupon[] {
  const translations = TRANSLATIONS_DATA[lang];
  if (!translations || !translations.coupons) {
    return coupons;
  }

  return coupons.map(coupon => {
    const trans = translations.coupons[coupon.code];
    if (!trans) return coupon;

    return {
      ...coupon,
      discount: trans.discount || coupon.discount,
      description: trans.description || coupon.description
    };
  });
}

export function getLocalizedCategories(categories: Category[], lang: string): Category[] {
  const translations = TRANSLATIONS_DATA[lang];
  if (!translations || !translations.categories) {
    return categories;
  }

  return categories.map(cat => {
    const trans = translations.categories[cat.id];
    if (!trans) return cat;

    return {
      ...cat,
      label: trans.label || cat.label
    };
  });
}

/**
 * Returns a 100% genuine, safe, and direct product search link
 * for Amazon or Flipkart, avoiding generic homepages.
 */
export function getVerifiedDirectLink(url: string, productName: string, store: 'amazon' | 'flipkart' | 'croma' | 'reliance' | string): string {
  if (!url || url === 'https://www.amazon.in' || url === 'https://www.amazon.com' || url === 'https://www.flipkart.com' || url.trim() === '') {
    if (store === 'amazon') {
      return `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
    } else if (store === 'flipkart') {
      return `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
    } else if (store === 'croma') {
      return `https://www.croma.com/searchB?q=${encodeURIComponent(productName)}`;
    } else if (store === 'reliance') {
      return `https://www.reliancedigital.in/search?q=${encodeURIComponent(productName)}`;
    } else {
      return `https://www.google.com/search?q=${encodeURIComponent(productName + ' buy online')}`;
    }
  }
  return url;
}

