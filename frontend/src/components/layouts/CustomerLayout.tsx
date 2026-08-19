import React from 'react';
import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { AIChatWidget } from '../widgets/AIChatWidget';
import { FloatingContactWidget } from '../widgets/FloatingContactWidget';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
      <FloatingContactWidget />
      <AIChatWidget />
    </div>
  );
};
