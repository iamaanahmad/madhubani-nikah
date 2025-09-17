'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { OnboardingModal } from '@/components/shared/onboarding-modal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
      <OnboardingModal />
    </SidebarProvider>
  );
}
