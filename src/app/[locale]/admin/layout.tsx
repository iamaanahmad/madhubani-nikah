import { AppAdminHeader } from '@/components/admin/app-admin-header';
import { AppAdminSidebar } from '@/components/admin/app-admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayout({children}: {children: React.ReactNode}) {
  return (
        <SidebarProvider>
          <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <AppAdminSidebar />
            <div className="flex flex-col">
              <AppAdminHeader />
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
  );
}
