'use client';

import React from 'react';
import { Image } from 'antd';
import { ZoomInOutlined } from '@ant-design/icons';

interface ProductGalleryProps {
  name: string;
  images: string[];
}

export function ProductGallery({ name, images }: ProductGalleryProps) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-3xl bg-stone-100">
      <Image
        src={images[0]}
        alt={name}
        className="!w-full !h-full object-cover"
        preview={{
          cover: (
            <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
              <ZoomInOutlined /> View image
            </div>
          ),
        }}
      />
    </div>
  );
}