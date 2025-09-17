'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { OnboardingModal } from '@/components/shared/onboarding-modal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="group-data-[variant=sidebar]:bg-sidebar"
      >
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <AppHeader />
        {children}
      </SidebarInset>
      <OnboardingModal />
    </SidebarProvider>
  );
}
