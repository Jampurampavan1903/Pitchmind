'use client';

import React from 'react';
import { PageContainer } from '../../components/layout/page-container';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageContainer>{children}</PageContainer>;
}
