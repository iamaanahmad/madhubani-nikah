'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
