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
            colorSuccess: '#38A3A5',
            colorWarning: '#DDA15E',
            colorError: '#BC4749',
            colorBgLayout: '#F8FAFC',
            colorBgContainer: '#FFFFFF',
            borderRadius: 10,
            borderRadiusLG: 14,
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
              colorBorder: '#E2E8F0',
            },
            Select: {
              controlHeight: 42,
              borderRadius: 8,
              colorBorder: '#E2E8F0',
            },
            Steps: {
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
