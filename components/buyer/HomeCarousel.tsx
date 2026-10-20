'use client';

import React, { useRef, useState } from 'react';
import { Carousel, type CarouselRef } from 'antd';
import Image from 'next/image';
import { HOME_SLIDES, type HomeSlide } from '@/constants/homeSlides';

function SlideContent({ slide }: { slide: HomeSlide }) {
  return (
    <div className="bg-sage rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sage-soft/80 sm:text-xs">
            {slide.eyebrow}
          </p>
          <h2 className="font-display text-base leading-snug tracking-tight text-white sm:text-xl">
            {slide.title}
          </h2>
          <p className="line-clamp-2 text-xs leading-relaxed text-sage-soft/90 sm:line-clamp-none sm:text-sm">
            {slide.description}
          </p>
          {slide.bullets && (
            <ul className="hidden pt-1 sm:block">
              {slide.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-1.5 text-xs text-sage-soft/90">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage-soft" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/10 p-2 sm:h-28 sm:w-28">
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            width={280}
            height={200}
            unoptimized
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

const AUTOPLAY_SPEED = 5000;

export function HomeCarousel() {
  const carouselRef = useRef<CarouselRef>(null);
  const [current, setCurrent] = useState(0);

  return (
    <section aria-label="Featured highlights" className="relative">
      <Carousel
        ref={carouselRef}
        afterChange={setCurrent}
        autoplay
        autoplaySpeed={AUTOPLAY_SPEED}
        infinite
        speed={700}
        easing="cubic-bezier(0.22, 1, 0.36, 1)"
        dots={false}
        className="!overflow-hidden rounded-xl"
      >
        {HOME_SLIDES.map((slide) => (
          <div key={slide.id}>
            <SlideContent slide={slide} />
          </div>
        ))}
      </Carousel>
      <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-3">
        {HOME_SLIDES.map((slide, index) => {
          const isActive = current === index;
          return (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => carouselRef.current?.goTo(index)}
              className={
                isActive
                  ? 'h-1.5 w-5 rounded-full bg-white transition-all duration-500'
                  : 'h-1.5 w-1.5 rounded-full bg-white/40 transition-all hover:bg-white/70'
              }
            />
          );
        })}
      </div>
    </section>
  );
}
