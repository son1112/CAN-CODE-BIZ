// Offline Service Worker for Rubber Ducky Live
// Provides advanced caching and offline functionality for mobile devices

const CACHE_NAME = 'rubber-ducky-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const STATIC_CACHE_RESOURCES = [
  '/',
  '/chat',
  '/manifest.json',
  // Critical CSS and JS would be added here
  // These would be generated during build process
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  '/api/sessions',
  '/api/agents',
  '/api/preferences'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static resources');
      return cache.addAll(STATIC_CACHE_RESOURCES);
    }).then(() => {
      // Skip waiting and immediately activate
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.includes('/_next/static/')) {
    // Static assets - Cache first
    event.respondWith(handleStaticAssets(request));
  } else {
    // Pages - Network first with offline fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Network first strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses for supported API routes
    if (networkResponse.ok && shouldCacheApiRoute(url.pathname)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request:', url.pathname);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving cached API response:', url.pathname);
      return cachedResponse;
    }

    // Return offline response for critical API routes
    if (url.pathname === '/api/sessions' || url.pathname === '/api/agents') {
      return new Response(JSON.stringify({
        error: 'Offline',
        cached: true,
        message: 'Data not available offline'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw error;
  }
}

// Cache first strategy for static assets
async function handleStaticAssets(request) {
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
    console.log('Service Worker: Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Network first with offline page fallback for pages
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for page:', request.url);

    // Try cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving cached page:', request.url);
      return cachedResponse;
    }

    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL) || new Response(
        createOfflinePage(),
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    throw error;
  }
}

// Check if API route should be cached
function shouldCacheApiRoute(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

// Create a basic offline page HTML
function createOfflinePage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Rubber Ducky Live</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .offline-container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
        }
        .duck-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .retry-button {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .retry-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        @media (max-width: 768px) {
            .offline-container {
                padding: 1rem;
            }
            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="duck-icon">🦆</div>
        <h1>You're Offline</h1>
        <p>Your rubber ducky is taking a swim! Check your internet connection and try again.</p>
        <button class="retry-button" onclick="window.location.reload()">
            Try Again
        </button>
    </div>

    <script>
        // Auto-refresh when connection is restored
        window.addEventListener('online', () => {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    </script>
</body>
</html>
  `;
}

// Handle background sync for queued messages
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);

  if (event.tag === 'rubber-ducky-sync') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when connection is restored
async function syncPendingData() {
  console.log('Service Worker: Syncing pending data...');

  try {
    // Get offline queue from IndexedDB or localStorage
    // This would integrate with the useOfflineMode hook's queue
    const pendingItems = await getPendingSyncItems();

    for (const item of pendingItems) {
      try {
        await syncItem(item);
        await removePendingItem(item.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync item:', item.id, error);
      }
    }

    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Placeholder functions for integration with offline queue
async function getPendingSyncItems() {
  // This would read from the same storage as useOfflineMode
  return [];
}

async function syncItem(item) {
  // Sync individual item to server
  const response = await fetch(item.endpoint, {
    method: item.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item.data)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

async function removePendingItem(itemId) {
  // Remove synced item from queue
  console.log('Service Worker: Item synced successfully:', itemId);
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push notification received:', data);

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'rubber-ducky-notification'
      })
    );
  }
});

console.log('Service Worker: Script loaded');