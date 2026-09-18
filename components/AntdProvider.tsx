'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#2D6A4F',
            colorInfo: '#2D6A4F',
            colorSuccess: '#2D6A4F',
            colorWarning: '#A97C3F',
            colorError: '#A64D42',
            colorBgLayout: '#FAFAF9',
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E2DDD4',
            colorBorderSecondary: '#EBE7DE',
            colorTextBase: '#1C1917',
            fontFamily:
              'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
            borderRadius: 8,
            borderRadiusLG: 12,
            borderRadiusSM: 6,
            wireframe: false,
          },
          components: {
            Card: {
              colorBorderSecondary: 'transparent',
              paddingLG: 24,
            },
            Button: {
              controlHeight: 42,
              borderRadius: 8,
              primaryShadow: 'none',
              fontWeight: 500,
            },
            Input: {
              controlHeight: 42,
              borderRadius: 8,
              colorBorder: '#E2DDD4',
            },
            Select: {
              controlHeight: 42,
              borderRadius: 8,
              colorBorder: '#E2DDD4',
            },
            Steps: {
              colorPrimary: '#2D6A4F',
            },
            Checkbox: {
              colorPrimary: '#2D6A4F',
            },
            Switch: {
              colorPrimary: '#2D6A4F',
            },
            Alert: {
              borderRadiusLG: 8,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}