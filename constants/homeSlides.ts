export interface HomeSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: readonly string[];
  image: string;
  imageAlt: string;
}

export const HOME_SLIDES: readonly HomeSlide[] = [
  {
    id: 'fresh-produce',
    eyebrow: 'Fresh harvest',
    title: 'Fruits & vegetables from local farms',
    description:
      'Seasonal fruits and vegetables picked at peak freshness and delivered straight to your door.',
    image: '/products/fruits.svg',
    imageAlt: 'Illustration of a basket of fresh fruit',
  },
  {
    id: 'features',
    eyebrow: 'Why AgriMarket',
    title: 'Everything you need to shop farm-fresh',
    description: 'Built for safe, straightforward buying from nearby farmers.',
    bullets: [
      'Verified local farmers and honest reviews',
      'Cash on delivery or GCash payment',
      'Live order tracking and easy returns',
    ],
    image: '/products/vegetables.svg',
    imageAlt: 'Illustration of fresh vegetables',
  },
  {
    id: 'about',
    eyebrow: 'About the system',
    title: 'AgriMarket connects farmers and buyers',
    description:
      'A community marketplace where local farmers list their harvests and buyers order safely with transparent pricing and support for returns.',
    image: '/AgriMarketLogo.png',
    imageAlt: 'AgriMarket logo',
  },
];
