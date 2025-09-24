'use client';

import React from 'react';
import { useInstallPrompt } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface InstallPromptProps {
  className?: string;
  variant?: 'banner' | 'card' | 'modal';
  showInstructions?: boolean;
}

export function InstallPrompt({ 
  className = '', 
  variant = 'banner',
  showInstructions = true 
}: InstallPromptProps) {
  const { showPrompt, isInstalling, installInstructions, install, dismiss } = useInstallPrompt();

  if (!showPrompt) return null;

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 ${className}`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Install Madhubani Nikah</h3>
              <p className="text-sm opacity-90">
                Get the full app experience with offline access and notifications
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              variant="secondary"
              size="sm"
              className="bg-white text-pink-600 hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
            
            <Button
              onClick={dismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg">Install App</CardTitle>
            </div>
            <Button
              onClick={dismiss}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Install Madhubani Nikah for a better experience with offline access and push notifications.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Push notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Faster loading</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Home screen access</span>
            </div>
          </div>

          {showInstructions && installInstructions && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                Installation Instructions ({installInstructions.platform}):
              </h4>
              <ol className="text-sm text-gray-600 space-y-1">
                {installInstructions.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-pink-600 font-medium">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isInstalling ? 'Installing...' : 'Install Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <CardTitle>Install Madhubani Nikah</CardTitle>
                <CardDescription>Get the full app experience</CardDescription>
              </div>
            </div>
            <Button
              onClick={dismiss}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Installing the app gives you:
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Monitor className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Offline Access</div>
                <div className="text-xs text-gray-500">Browse profiles even without internet</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Faster Performance</div>
                <div className="text-xs text-gray-500">Instant loading and smooth navigation</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={dismiss}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}