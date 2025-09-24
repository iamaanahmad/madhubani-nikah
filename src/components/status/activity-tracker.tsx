'use client';

import { useEffect } from 'react';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useAuth } from '@/hooks/useAuth';

interface ActivityTrackerProps {
  trackPageViews?: boolean;
  trackInteractions?: boolean;
  trackSearches?: boolean;
  children?: React.ReactNode;
}

export function ActivityTracker({
  trackPageViews = true,
  trackInteractions = true,
  trackSearches = true,
  children,
}: ActivityTrackerProps) {
  const { user } = useAuth();
  const { trackActivity } = useUserStatus(user?.$id);

  // Track page views
  useEffect(() => {
    if (!trackPageViews || !user?.$id) return;

    const handlePageView = () => {
      trackActivity('page_visit', {
        url: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
    };

    // Track initial page view
    handlePageView();

    // Track navigation changes (for SPA)
    const handlePopState = () => {
      setTimeout(handlePageView, 100); // Small delay to ensure page title is updated
    };

    window.addEventListener('popstate', handlePopState);

    // Track programmatic navigation (pushState/replaceState)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handlePageView, 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handlePageView, 100);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [trackPageViews, user?.$id, trackActivity]);

  // Track user interactions
  useEffect(() => {
    if (!trackInteractions || !user?.$id) return;

    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;

      // Track specific interactions
      if (tagName === 'button' || target.closest('button')) {
        const button = tagName === 'button' ? target : target.closest('button');
        trackActivity('button_click', {
          buttonText: button?.textContent?.trim(),
          buttonId: button?.id,
          buttonClass: button?.className,
          page: window.location.pathname,
        });
      } else if (tagName === 'a' || target.closest('a')) {
        const link = tagName === 'a' ? target : target.closest('a');
        trackActivity('link_click', {
          linkText: link?.textContent?.trim(),
          linkHref: (link as HTMLAnchorElement)?.href,
          page: window.location.pathname,
        });
      } else if (tagName === 'input' && (target as HTMLInputElement).type === 'submit') {
        trackActivity('form_submit', {
          formId: target.closest('form')?.id,
          page: window.location.pathname,
        });
      }
    };

    // Throttle interaction tracking to avoid spam
    let lastTrack = 0;
    const throttledHandler = (event: Event) => {
      const now = Date.now();
      if (now - lastTrack > 1000) { // Max 1 interaction per second
        handleInteraction(event);
        lastTrack = now;
      }
    };

    document.addEventListener('click', throttledHandler, { passive: true });

    return () => {
      document.removeEventListener('click', throttledHandler);
    };
  }, [trackInteractions, user?.$id, trackActivity]);

  // Track search activities
  useEffect(() => {
    if (!trackSearches || !user?.$id) return;

    const handleSearch = (event: Event) => {
      const target = event.target as HTMLInputElement;
      
      if (target.type === 'search' || 
          target.name?.includes('search') || 
          target.placeholder?.toLowerCase().includes('search')) {
        
        const searchTerm = target.value.trim();
        if (searchTerm.length > 2) { // Only track meaningful searches
          trackActivity('search', {
            searchTerm,
            searchField: target.name || target.id,
            page: window.location.pathname,
          });
        }
      }
    };

    // Debounce search tracking
    let searchTimeout: NodeJS.Timeout;
    const debouncedHandler = (event: Event) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => handleSearch(event), 500);
    };

    document.addEventListener('input', debouncedHandler, { passive: true });

    return () => {
      document.removeEventListener('input', debouncedHandler);
      clearTimeout(searchTimeout);
    };
  }, [trackSearches, user?.$id, trackActivity]);

  return <>{children}</>;
}

// Higher-order component for automatic activity tracking
export function withActivityTracking<P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<ActivityTrackerProps>
) {
  return function ActivityTrackedComponent(props: P) {
    return (
      <ActivityTracker {...options}>
        <Component {...props} />
      </ActivityTracker>
    );
  };
}

// Hook for manual activity tracking
export function useActivityTracker() {
  const { user } = useAuth();
  const { trackActivity } = useUserStatus(user?.$id);

  return {
    trackProfileView: (profileId: string) => {
      trackActivity('profile_view', { profileId });
    },
    
    trackInterestSent: (receiverId: string, interestType: string) => {
      trackActivity('interest_sent', { receiverId, interestType });
    },
    
    trackMessageSent: (receiverId: string) => {
      trackActivity('message_sent', { receiverId });
    },
    
    trackSearch: (filters: Record<string, any>) => {
      trackActivity('search', { filters });
    },
    
    trackCustomActivity: (type: string, data?: Record<string, any>) => {
      trackActivity(type as any, data);
    },
  };
}