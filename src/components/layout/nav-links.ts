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
    { href: '/', label: 'home', icon: Home },
    { href: '/browse', label: 'browseProfiles', icon: Users },
    { href: '/search', label: 'search', icon: Search },
    { href: '/stories', label: 'successStories', icon: Heart },
    { href: '/guidance', label: 'islamicGuidance', icon: BookOpen },
    { href: '/about', label: 'aboutUs', icon: Info },
    { href: '/help', label: 'help', icon: LifeBuoy },
  ];
  
