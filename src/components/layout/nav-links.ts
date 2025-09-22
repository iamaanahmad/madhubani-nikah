import {
    Home,
    Search,
    Heart,
    BookOpen,
    Info,
    LifeBuoy,
    Users,
  } from 'lucide-react';
  
  export const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/browse', label: 'Browse Profiles', icon: Users },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/stories', label: 'Success Stories', icon: Heart },
    { href: '/guidance', label: 'Islamic Guidance', icon: BookOpen },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/help', label: 'Help', icon: LifeBuoy },
  ];
  