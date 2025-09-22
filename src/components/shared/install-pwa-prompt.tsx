'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

export function InstallPwaPrompt() {
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      // Check if the prompt has been dismissed before
      if (!localStorage.getItem('pwa_prompt_dismissed')) {
         setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
        setIsVisible(false);
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-background border rounded-xl shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in-50 duration-500">
             <Image src="/IconLogo.png" alt="App Logo" width={48} height={48} className="rounded-lg" />
            <div className="flex-grow">
                <h4 className="font-bold font-headline">Install the App</h4>
                <p className="text-sm text-muted-foreground">Get a better experience on our app.</p>
            </div>
            <Button size="sm" onClick={handleInstall}>
                <Download className="mr-2 h-4 w-4" />
                Install
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={handleDismiss}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    </div>
  );
}
