
'use client';
import * as React from 'react';
import { Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const FONT_STEP = 2;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 20;

export function AccessibilityToolbar() {
  const { setTheme, theme } = useTheme();
  const [fontSize, setFontSize] = React.useState(16);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', `${fontSize}px`);
  }, [fontSize]);

  const handleZoomIn = () => {
    setFontSize((prevSize) => Math.min(prevSize + FONT_STEP, MAX_FONT_SIZE));
  };

  const handleZoomOut = () => {
    setFontSize((prevSize) => Math.max(prevSize - FONT_STEP, MIN_FONT_SIZE));
  };

  return (
    <div className="flex items-center gap-2 rounded-full border bg-background p-1">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={handleZoomOut}
        disabled={fontSize <= MIN_FONT_SIZE}
        aria-label="Decrease font size"
      >
        <ZoomOut className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={handleZoomIn}
        disabled={fontSize >= MAX_FONT_SIZE}
        aria-label="Increase font size"
      >
        <ZoomIn className="h-5 w-5" />
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
