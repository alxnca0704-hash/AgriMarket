'use client';

import React from 'react';
import { Carousel } from 'antd';

const PROMO_SLIDES = [
  {
    eyebrow: 'Fresh harvest',
    title: 'Order straight from farms near you',
    body: 'Daily harvests from verified farms across the Philippines.',
  },
  {
    eyebrow: 'Free delivery',
    title: 'P500 minimum, P2,000 gets free delivery',
    body: 'Mixed-market orders from any seller, bundled and priced up front.',
  },
  {
    eyebrow: 'Pick-up points',
    title: 'Pick up at a barangay hub near you',
    body: 'No waiting at home — collect when it suits you.',
  },
] as const;

export function PromoCarousel() {
  return (
    <Carousel autoplay dots={{ className: '!bottom-1' }} className="overflow-hidden rounded-2xl">
      {PROMO_SLIDES.map((slide) => (
        <div key={slide.eyebrow}>
          <div className="rounded-2xl bg-gradient-to-r from-[#2D6A4F] via-[#3D7A5F] to-[#5C8D6E] px-5 py-6 sm:px-8 sm:py-8 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 block mb-1.5">
              {slide.eyebrow}
            </span>
            <h3 className="text-lg sm:text-2xl font-semibold leading-tight max-w-md">
              {slide.title}
            </h3>
            <p className="text-sm text-white/75 mt-2 max-w-lg leading-relaxed">{slide.body}</p>
          </div>
        </div>
      ))}
    </Carousel>
  );
}