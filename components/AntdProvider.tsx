'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App, theme as antdTheme } from 'antd';

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
            Badge: {
              indicatorHeight: 20,
              indicatorHeightSM: 18,
              textFontSize: 12,
              textFontSizeSM: 11,
              textFontWeight: 600,
              paddingInline: 7,
              statusSize: 8,
            },
            Menu: {
              itemBorderRadius: 10,
              itemHeight: 44,
              itemMarginInline: 8,
              itemMarginBlock: 3,
              itemPaddingInline: 12,
              itemColor: '#57534E',
              itemHoverBg: '#F5F5F4',
              itemHoverColor: '#1C1917',
              itemSelectedBg: '#E9F0EB',
              itemSelectedColor: '#2D6A4F',
              iconMarginInlineEnd: 12,
              activeBarBorderWidth: 0,
            },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}