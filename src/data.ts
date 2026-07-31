import { GadgetProduct } from './types';

export const GADGETS_DATA: GadgetProduct[] = [
  {
    id: 'iphone-15-pro',
    name: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
    category: 'smartphones',
    brand: 'Apple',
    priceAmazon: 121999,
    priceFlipkart: 122499,
    originalPrice: 134900,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 1420,
    expertNote: 'The titanium design and A17 Pro chip make it a performance powerhouse. If camera precision and custom Action Button matter, this is the benchmark.',
    pros: [
      'Stunning grade 5 titanium build feels premium and light',
      'A17 Pro chip handles console-level gaming effortlessly',
      'Highly versatile camera with incredible 3x optical zoom',
      'USB-C port finally introduced with high transfer speeds'
    ],
    cons: [
      'Battery life is decent but not as stellar as the Pro Max model',
      'Heats slightly under continuous heavy benchmarks or 4K recording'
    ],
    specs: {
      'Display': '6.1-inch Super Retina XDR OLED, 120Hz',
      'Processor': 'Apple A17 Pro (3nm)',
      'Camera': '48MP Main + 12MP Ultra Wide + 12MP 3x Telephoto',
      'Battery': '3274 mAh, 20W wired charging',
      'OS': 'iOS 17 (Upgradable to iOS 18)',
      'Weight': '187g'
    },
    specHighlights: ['A17 Pro Chip', 'Grade 5 Titanium', 'Pro camera system', 'USB-C Port'],
    isTrending: true,
    priceHistory: [
      { date: 'Feb 2026', amazon: 128900, flipkart: 129000 },
      { date: 'Mar 2026', amazon: 125999, flipkart: 127000 },
      { date: 'Apr 2026', amazon: 124500, flipkart: 125000 },
      { date: 'May 2026', amazon: 122999, flipkart: 123500 },
      { date: 'Jun 2026', amazon: 121999, flipkart: 122499 },
      { date: 'Jul 2026', amazon: 121999, flipkart: 122499 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 256GB)',
    category: 'smartphones',
    brand: 'Samsung',
    priceAmazon: 129999,
    priceFlipkart: 129999,
    originalPrice: 144999,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 1850,
    expertNote: 'The ultimate Android package. Galaxy AI tools are genuinely helpful, and the anti-reflective flat display with S-Pen remains unmatched.',
    pros: [
      'Incredible anti-reflective display makes outdoor visibility crisp',
      'Outstanding 200MP camera system with up to 100x zoom capability',
      'Built-in responsive S-Pen with productive features',
      'Industry-leading 7 years of Android OS and security upgrades'
    ],
    cons: [
      'Very bulky and heavy in hand for single-handed usage',
      'Wired charging speeds capped at 45W'
    ],
    specs: {
      'Display': '6.8-inch Dynamic AMOLED 2X, QHD+, 120Hz',
      'Processor': 'Snapdragon 8 Gen 3 for Galaxy',
      'Camera': '200MP + 50MP + 12MP + 10MP Quad Setup',
      'Battery': '5000 mAh, 45W fast charging',
      'OS': 'Android 14 (One UI 6.1)',
      'Weight': '232g'
    },
    specHighlights: ['Galaxy AI', 'Snapdragon 8 Gen 3', '200MP Camera', 'S-Pen Built-in'],
    isTrending: true,
    priceHistory: [
      { date: 'Feb 2026', amazon: 134999, flipkart: 134999 },
      { date: 'Mar 2026', amazon: 132999, flipkart: 133499 },
      { date: 'Apr 2026', amazon: 131999, flipkart: 131999 },
      { date: 'May 2026', amazon: 129999, flipkart: 130500 },
      { date: 'Jun 2026', amazon: 129999, flipkart: 129999 },
      { date: 'Jul 2026', amazon: 129999, flipkart: 129999 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'macbook-air-m3',
    name: 'Apple MacBook Air Laptop M3 (13.6-inch, 8GB, 256GB SSD)',
    category: 'laptops',
    brand: 'Apple',
    priceAmazon: 104900,
    priceFlipkart: 106900,
    originalPrice: 114900,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 980,
    expertNote: 'For students and professional creators on the go, the silent, fanless MacBook Air M3 sets a high bar with an amazing battery life and sleek build.',
    pros: [
      'Dead silent, fanless thermal design avoids dust build-up',
      'M3 chip is blistering fast for code, video edits, and web work',
      'Unmatched battery life of up to 18 hours on daily mixed usage',
      'Supports dual external displays with laptop lid closed'
    ],
    cons: [
      'Base model is limited to 8GB unified memory and 256GB SSD',
      'Only 2 Thunderbolt ports can limit external accessory options'
    ],
    specs: {
      'Display': '13.6-inch Liquid Retina display with True Tone',
      'Processor': 'Apple M3 chip (8-core CPU, 8-core GPU)',
      'Memory': '8GB Unified Memory (Configurable)',
      'Storage': '256GB superfast SSD',
      'Battery': 'Up to 18 hours wireless web',
      'Weight': '1.24 kg'
    },
    specHighlights: ['M3 Powerhouse', 'Silent Fanless Design', '18hr Battery Life', 'Lightweight 1.24kg'],
    isTrending: true,
    priceHistory: [
      { date: 'Feb 2026', amazon: 114900, flipkart: 114900 },
      { date: 'Mar 2026', amazon: 111900, flipkart: 112500 },
      { date: 'Apr 2026', amazon: 109900, flipkart: 109900 },
      { date: 'May 2026', amazon: 107900, flipkart: 108900 },
      { date: 'Jun 2026', amazon: 105900, flipkart: 106900 },
      { date: 'Jul 2026', amazon: 104900, flipkart: 106900 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    category: 'audio',
    brand: 'Sony',
    priceAmazon: 27990,
    priceFlipkart: 28499,
    originalPrice: 34990,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviewsCount: 3240,
    expertNote: 'Industry-leading Active Noise Cancellation paired with incredibly plush comfort. Perfect for frequent flyers and focus-heavy study sessions.',
    pros: [
      'Sensational ANC that dampens vocal and rumble frequencies',
      'Extremely lightweight frame with pressure-relieving leather cushions',
      'Crystal-clear dual-mic system with smart voice-pickup tech',
      'Smart speak-to-chat features automate ambient modes'
    ],
    cons: [
      'Cannot fold as compactly into its case as the older XM4',
      'Touch controls can be overly sensitive under humid conditions'
    ],
    specs: {
      'Drivers': '30mm high-compliance dome driver',
      'ANC': 'Auto NC Optimizer with 8 microphones',
      'Bluetooth': 'V5.2 with LDAC and multipoint connections',
      'Battery': 'Up to 30 hours with ANC active, 40 hours off',
      'Charging': 'USB-C fast charge (3 mins = 3 hours playback)'
    },
    specHighlights: ['Supreme Noise Cancelling', '30hr Playback', 'Smart Ambient Mode', 'Plush Comfort'],
    isTrending: false,
    priceHistory: [
      { date: 'Feb 2026', amazon: 29990, flipkart: 29990 },
      { date: 'Mar 2026', amazon: 28990, flipkart: 29499 },
      { date: 'Apr 2026', amazon: 28500, flipkart: 28999 },
      { date: 'May 2026', amazon: 27990, flipkart: 28499 },
      { date: 'Jun 2026', amazon: 27990, flipkart: 28499 },
      { date: 'Jul 2026', amazon: 27990, flipkart: 28499 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'galaxy-watch-6',
    name: 'Samsung Galaxy Watch 6 LTE (44mm, Bluetooth + LTE)',
    category: 'wearables',
    brand: 'Samsung',
    priceAmazon: 21999,
    priceFlipkart: 22499,
    originalPrice: 36999,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=80',
    rating: 4.5,
    reviewsCount: 710,
    expertNote: 'With its larger crisp display, improved sleep insights, and seamless WearOS layout, it is the best companion smartwatch for Android users.',
    pros: [
      'Bright, high-resolution sapphire crystal AMOLED screen',
      'Comprehensive body composition sensor (BIA) and ECG monitoring',
      'Smooth Google WearOS apps interface with rotating bezel layout'
    ],
    cons: [
      'Requires daily charging (average 1.5 days battery)',
      'Advanced ECG features are limited to Samsung devices only'
    ],
    specs: {
      'Display': '1.5-inch Super AMOLED Display',
      'Processor': 'Exynos W930 Dual-Core 1.4GHz',
      'Storage/RAM': '2GB RAM + 16GB ROM',
      'Sensors': 'BIA, ECG, HR, SpO2, Temperature, Sleep',
      'Protection': 'IP68 & 5ATM Water Resistance'
    },
    specHighlights: ['Sapphire Screen', 'Body Composition Tech', 'WearOS Ecosystem', 'ECG Monitoring'],
    isTrending: false,
    priceHistory: [
      { date: 'Feb 2026', amazon: 25999, flipkart: 26500 },
      { date: 'Mar 2026', amazon: 24500, flipkart: 24999 },
      { date: 'Apr 2026', amazon: 23999, flipkart: 23999 },
      { date: 'May 2026', amazon: 22999, flipkart: 23500 },
      { date: 'Jun 2026', amazon: 21999, flipkart: 22499 },
      { date: 'Jul 2026', amazon: 21999, flipkart: 22499 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12 5G (Flowy Emerald, 16GB RAM, 512GB)',
    category: 'smartphones',
    brand: 'OnePlus',
    priceAmazon: 64999,
    priceFlipkart: 65999,
    originalPrice: 69999,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 1120,
    expertNote: 'A true flagship-killer in specifications. The combination of Snapdragon 8 Gen 3, Hasselblad cameras, and 100W charging makes it an absolute beast.',
    pros: [
      'Insanely fast 100W charging (0-100% in under 26 mins)',
      'Beautiful Flowy Emerald premium rear glass texture',
      'Exceptional Hasselblad color tuning on portraits',
      'Incredible battery backup with dual-cell 5400mAh design'
    ],
    cons: [
      'No official IP68 rating (IP65 splash-proof only)',
      'A bit heavy at 220g and thick curved display'
    ],
    specs: {
      'Display': '6.82-inch 2K BOE X1 Oriental AMOLED, 120Hz',
      'Processor': 'Snapdragon 8 Gen 3',
      'Camera': '50MP + 64MP 3x Telephoto + 48MP Ultra Wide',
      'Battery': '5400 mAh, 100W wired, 50W wireless',
      'OS': 'OxygenOS based on Android 14'
    },
    specHighlights: ['100W Charging', 'Hasselblad Portrait', 'Snapdragon 8 Gen 3', '5400mAh Battery'],
    isTrending: true,
    priceHistory: [
      { date: 'Feb 2026', amazon: 69999, flipkart: 69999 },
      { date: 'Mar 2026', amazon: 67999, flipkart: 68499 },
      { date: 'Apr 2026', amazon: 66999, flipkart: 66999 },
      { date: 'May 2026', amazon: 65999, flipkart: 65999 },
      { date: 'Jun 2026', amazon: 64999, flipkart: 65999 },
      { date: 'Jul 2026', amazon: 64999, flipkart: 65999 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'airpods-pro-2',
    name: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
    category: 'audio',
    brand: 'Apple',
    priceAmazon: 22900,
    priceFlipkart: 23499,
    originalPrice: 24900,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 2150,
    expertNote: 'The gold standard for wireless earbuds, especially if you live in the Apple ecosystem. Adaptive audio and Spatial sound are phenomenally executed.',
    pros: [
      'Incredible double ANC performance over previous model',
      'Adaptive Audio dynamically blends ambient awareness and ANC',
      'Case includes speaker for Find My precision tracking',
      'Touch-swipe stem for volume adjustment works flawlessly'
    ],
    cons: [
      'Limited audio codec support for high-res playback on Android',
      'Expensive compared to competitors with similar driver size'
    ],
    specs: {
      'Chip': 'Apple H2 Headphone chip, U1 in MagSafe Case',
      'ANC': 'Yes, up to 2x more active cancellation',
      'Battery': 'Up to 6 hours (30 hours total with charging case)',
      'Connection': 'Bluetooth 5.3',
      'Charging': 'USB-C, Apple Watch Charger, or MagSafe'
    },
    specHighlights: ['Apple H2 Chip', 'Adaptive Audio', 'MagSafe tracking case', 'Volume Swipes'],
    isTrending: false,
    priceHistory: [
      { date: 'Feb 2026', amazon: 24900, flipkart: 24900 },
      { date: 'Mar 2026', amazon: 23900, flipkart: 24499 },
      { date: 'Apr 2026', amazon: 23500, flipkart: 23999 },
      { date: 'May 2026', amazon: 22900, flipkart: 23499 },
      { date: 'Jun 2026', amazon: 22900, flipkart: 23499 },
      { date: 'Jul 2026', amazon: 22900, flipkart: 23499 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'keychron-k2',
    name: 'Keychron K2 V2 Wireless Mechanical Keyboard (Gateron Brown)',
    category: 'accessories',
    brand: 'Keychron',
    priceAmazon: 7499,
    priceFlipkart: 7999,
    originalPrice: 8999,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 430,
    expertNote: 'A gorgeous, tactile entry into mechanical keyboards. Easily switches between Mac & Windows layouts with standard dedicated switches.',
    pros: [
      'Tactile and relatively silent Gateron Brown key switches',
      'Incredible battery life with a massive 4000mAh built-in pack',
      'Simultaneous Bluetooth pairing for up to 3 devices',
      'Dedicated media keys and beautiful custom keycaps included'
    ],
    cons: [
      'Relatively high profile (wrist rest recommended for long writing sessions)',
      'Plastic build is highly durable but lacks premium aluminum weight'
    ],
    specs: {
      'Layout': '75% Layout (84 Keys)',
      'Switches': 'Gateron G-Pro Mechanical (Brown/Blue/Red)',
      'Connectivity': 'Bluetooth 5.1 / Wired USB Type-C',
      'Battery': '4000 mAh Rechargeable Li-polymer',
      'Backlight': 'RGB backlighting with 18 distinct modes'
    },
    specHighlights: ['75% Compact Layout', 'Triple Bluetooth Pairing', 'Mac & Win Dedicated Keys', 'Tactile Gateron Switches'],
    isTrending: false,
    priceHistory: [
      { date: 'Feb 2026', amazon: 8499, flipkart: 8499 },
      { date: 'Mar 2026', amazon: 7999, flipkart: 8299 },
      { date: 'Apr 2026', amazon: 7799, flipkart: 7999 },
      { date: 'May 2026', amazon: 7499, flipkart: 7999 },
      { date: 'Jun 2026', amazon: 7499, flipkart: 7999 },
      { date: 'Jul 2026', amazon: 7499, flipkart: 7999 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  },
  {
    id: 'rog-zephyrus-g14',
    name: 'ASUS ROG Zephyrus G14 (AMD Ryzen 9, RTX 4060, 16GB, 1TB)',
    category: 'laptops',
    brand: 'ASUS',
    priceAmazon: 144990,
    priceFlipkart: 147990,
    originalPrice: 169990,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 290,
    expertNote: 'The ultimate compact gaming laptop. It delivers thin-and-light portability without compromising on serious 1440p gaming and rendering horsepower.',
    pros: [
      'Incredibly vivid 14-inch ROG Nebula OLED 120Hz panel',
      'Exceptional processing power with Ryzen 9 and Ada Lovelace RTX 4060',
      'Highly portable chassis weighing only 1.5kg',
      'Surprisingly good speaker array and loud bass response'
    ],
    cons: [
      'Runs quite hot under sustained rendering or intensive gaming',
      'Fans can get exceptionally loud in Turbo mode'
    ],
    specs: {
      'Display': '14-inch OLED QHD+ (2880 x 1800), 120Hz',
      'Processor': 'AMD Ryzen 9 8945HS (8 Cores/16 Threads)',
      'Graphics': 'NVIDIA GeForce RTX 4060 (8GB GDDR6)',
      'Memory': '16GB LPDDR5X (Dual Channel)',
      'Storage': '1TB PCIe 4.0 NVMe SSD',
      'Weight': '1.50 kg'
    },
    specHighlights: ['OLED Nebula Panel', 'Ryzen 9 & RTX 4060', 'Sleek 1.5kg Frame', 'Premium Audio Setup'],
    isTrending: true,
    priceHistory: [
      { date: 'Feb 2026', amazon: 154990, flipkart: 156000 },
      { date: 'Mar 2026', amazon: 149990, flipkart: 151000 },
      { date: 'Apr 2026', amazon: 146990, flipkart: 148990 },
      { date: 'May 2026', amazon: 144990, flipkart: 147990 },
      { date: 'Jun 2026', amazon: 144990, flipkart: 147990 },
      { date: 'Jul 2026', amazon: 144990, flipkart: 147990 }
    ],
    buyUrlAmazon: 'https://www.amazon.in',
    buyUrlFlipkart: 'https://www.flipkart.com'
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Gadgets', icon: 'Sparkles' },
  { id: 'smartphones', label: 'Smartphones', icon: 'Smartphone' },
  { id: 'laptops', label: 'Laptops', icon: 'Laptop' },
  { id: 'audio', label: 'Audio & Music', icon: 'Headphones' },
  { id: 'wearables', label: 'Wearables', icon: 'Watch' },
  { id: 'accessories', label: 'Accessories', icon: 'Keyboard' }
];

export const SAVED_COUPONS: any[] = [];
