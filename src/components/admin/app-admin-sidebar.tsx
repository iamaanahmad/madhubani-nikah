import { Link } from 'next-intl/navigation';
import {
  Bell,
  CircleUser,
  Heart,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  Search,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Users,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Logo } from '../shared/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar';

const adminNavLinks = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users, badge: '12' },
    { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, badge: '3' },
    { href: '/admin/stories', label: 'Success Stories', icon: Heart },
    { href: '/admin/reports', label: 'Reports', icon: ShieldAlert, badge: '4' },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
];


export function AppAdminSidebar() {
  return (
    <>
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Logo />
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {adminNavLinks.map(link => (
                <Link key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {link.badge}
                </Badge>}
                </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Contact support for any questions about the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
     <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {adminNavLinks.map(link => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton asChild>
                            <Link href={link.href} className='flex items-center gap-3'>
                                <link.icon className="h-4 w-4" />
                                {link.label}
                                {link.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                    {link.badge}
                                </Badge>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
   </>
  );
}
