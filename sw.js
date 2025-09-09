// Service Worker for can.code website caching strategy
// Version: 1.0.0

const CACHE_NAME = 'can-code-v1';
const STATIC_CACHE = 'can-code-static-v1';
const DYNAMIC_CACHE = 'can-code-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.min.css',
  '/screenshots/1756957668700-cutout.webp',
  '/screenshots/1756957668700-cutout.png',
  '/screenshots/storytime-star-demo.webp',
  '/screenshots/project-universe-demo.webp',
  '/screenshots/replayready-demo.webp'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Images: Cache first, network fallback
  images: /\.(png|jpg|jpeg|gif|webp|svg)$/,
  // Styles: Network first, cache fallback  
  styles: /\.(css)$/,
  // HTML: Network first, cache fallback
  pages: /\.(html|htm)$/
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

// Request handling with appropriate cache strategy
async function handleRequest(request) {
  const url = request.url;
  
  try {
    // Images: Cache first strategy
    if (CACHE_STRATEGIES.images.test(url)) {
      return await cacheFirst(request);
    }
    
    // Styles and pages: Network first strategy
    if (CACHE_STRATEGIES.styles.test(url) || CACHE_STRATEGIES.pages.test(url)) {
      return await networkFirst(request);
    }
    
    // Default: Network first for everything else
    return await networkFirst(request);
    
  } catch (error) {
    console.error('Service Worker: Request handling failed:', error);
    return await caches.match('/index.html'); // Fallback to index
  }
}

// Cache first strategy - good for images
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return await caches.match(request);
  }
}

// Network first strategy - good for HTML and CSS
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first: Network failed, trying cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Background sync for future enhancements
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Implement background sync logic here if needed
  }
});

// Push notifications placeholder
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  // Implement push notifications if needed
});

console.log('Service Worker: Loaded successfully');