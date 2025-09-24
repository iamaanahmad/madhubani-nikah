// Service Worker for PWA functionality
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'madhubani-nikah-v1';
const OFFLINE_CACHE = 'madhubani-nikah-offline-v1';
const DYNAMIC_CACHE = 'madhubani-nikah-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/profiles',
  '/api/interests',
  '/api/notifications'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.add('/offline');
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== OFFLINE_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(url)) {
      event.respondWith(networkFirst(request));
    } else if (isNavigationRequest(request)) {
      event.respondWith(navigationHandler(request));
    } else {
      event.respondWith(staleWhileRevalidate(request));
    }
  } else {
    // Handle POST, PUT, DELETE requests
    event.respondWith(handleMutationRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineActions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(showNotification(data));
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Caching strategies
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return createOfflineResponse(request);
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || await fetchPromise;
}

async function navigationHandler(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

async function handleMutationRequest(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    // Store failed requests for background sync
    await storeOfflineAction(request);
    
    // Register background sync
    await self.registration.sync.register('background-sync');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Request queued for when online',
        queued: true 
      }),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper functions
function isStaticAsset(url: URL): boolean {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

function isAPIRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('appwrite') ||
         CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
}

function isNavigationRequest(request: Request): boolean {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function createOfflineResponse(request: Request): Response {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response('Offline', { status: 503 });
}

// Offline action storage
async function storeOfflineAction(request: Request): Promise<void> {
  const db = await openOfflineDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');
  
  const action = {
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  await store.add(action);
}

async function processOfflineActions(): Promise<void> {
  const db = await openOfflineDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');
  const actions = await store.getAll();
  
  for (const action of actions) {
    try {
      const request = new Request(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        await store.delete(action.id);
        
        // Notify clients of successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            action: action
          });
        });
      }
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MadhubaniNikahOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('actions')) {
        const store = db.createObjectStore('actions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function showNotification(data: any): Promise<void> {
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: data.priority === 'high',
    silent: data.priority === 'low'
  };
  
  await self.registration.showNotification(data.title, options);
}

// Export for TypeScript
export {};