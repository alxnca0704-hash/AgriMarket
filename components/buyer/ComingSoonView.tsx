'use client';

import React from 'react';
import { Result } from 'antd';

export function ComingSoonView({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Result
        status="info"
        title="Under development"
        subTitle={
          description ??
          'This part of the prototype is on the roadmap. The interactive checkout, order tracking, and account tools will be built next.'
        }
        extra={<span className="text-xs text-stone-400">{title}</span>}
      />
    </div>
  );
}