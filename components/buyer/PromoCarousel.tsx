'use client';

import React, { useRef, useState } from 'react';
import { Carousel, type CarouselRef } from 'antd';

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
  const carouselRef = useRef<CarouselRef>(null);
  const [current, setCurrent] = useState(0);

  return (
    <div className="relative">
      <Carousel
        ref={carouselRef}
        autoplay
        autoplaySpeed={4800}
        dots={false}
        waitForAnimate
        afterChange={setCurrent}
        className="overflow-hidden rounded-2xl"
      >
        {PROMO_SLIDES.map((slide) => (
          <div key={slide.eyebrow}>
            <div className="relative flex h-52 sm:h-60 flex-col justify-center overflow-hidden bg-sage px-7 py-12 text-white sm:px-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-24 right-28 h-56 w-56 rounded-full bg-black/10" />
              <span className="relative mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {slide.eyebrow}
              </span>
              <h3 className="relative max-w-md text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                {slide.title}
              </h3>
              <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
                {slide.body}
              </p>
            </div>
          </div>
        ))}
      </Carousel>

      <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
        {PROMO_SLIDES.map((slide, index) => (
          <button
            key={slide.eyebrow}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => carouselRef.current?.goTo(index)}
            className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
              index === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/85'
            }`}
          />
        ))}
      </div>
    </div>
  );
}