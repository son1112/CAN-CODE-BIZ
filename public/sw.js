// Rubber Ducky Live Service Worker
// Version: 1.0.0

const CACHE_NAME = 'rubber-ducky-v1.0.0';
const OFFLINE_CACHE = 'rubber-ducky-offline-v1.0.0';
const RUNTIME_CACHE = 'rubber-ducky-runtime-v1.0.0';

// Resources to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/rubber-duck-avatar.png'
];

// Resources to cache as they're requested
const RUNTIME_CACHE_URLS = [
  '/api/sessions',
  '/api/agents',
  '/api/stars'
];

// API endpoints that should be cached with network-first strategy
const API_CACHE_PATTERNS = [
  /^\/api\/sessions$/,
  /^\/api\/agents$/,
  /^\/api\/stars$/,
  /^\/api\/tags$/
];

// API endpoints that should never be cached (streaming, real-time)
const NO_CACHE_PATTERNS = [
  /^\/api\/chat$/,
  /^\/api\/speech-token$/,
  /^\/api\/export\//
];

self.addEventListener('install', (event) => {
  console.log('🦆 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Create offline cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('🔄 Service Worker: Setting up offline cache');
        return cache.add('/offline');
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('🦆 Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== RUNTIME_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/')) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with smart caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Never cache real-time endpoints
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkOnly(request);
  }
  
  // Cache-friendly API endpoints with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkFirst(request, RUNTIME_CACHE);
  }
  
  // Default: network-only for other API requests
  return handleNetworkOnly(request);
}

// Handle static assets (JS, CSS, images)
async function handleStaticAsset(request) {
  return handleCacheFirst(request, CACHE_NAME);
}

// Handle page requests
async function handlePageRequest(request) {
  return handleNetworkFirst(request, CACHE_NAME);
}

// Network-first strategy (good for dynamic content)
async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // If successful, update cache
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Service Worker: Network failed, trying cache for:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a page request and nothing in cache, show offline page
    if (request.destination === 'document') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Cache-first strategy (good for static assets)
async function handleCacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {}); // Ignore background update failures
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Service Worker: Failed to fetch:', request.url);
    throw error;
  }
}

// Network-only strategy (for real-time endpoints)
async function handleNetworkOnly(request) {
  return fetch(request);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

// Sync messages that were queued while offline
async function syncOfflineMessages() {
  try {
    const db = await openOfflineDB();
    const messages = await getOfflineMessages(db);
    
    console.log(`📤 Service Worker: Syncing ${messages.length} offline messages`);
    
    for (const message of messages) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await removeOfflineMessage(db, message.id);
          console.log('✅ Service Worker: Synced offline message:', message.id);
        }
      } catch (error) {
        console.log('❌ Service Worker: Failed to sync message:', message.id, error);
      }
    }
  } catch (error) {
    console.log('❌ Service Worker: Background sync failed:', error);
  }
}

// Simple IndexedDB wrapper for offline message queue
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RubberDuckyOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getOfflineMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeOfflineMessage(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Your rubber duck has something to say!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: 'open',
          title: 'Open Chat',
          icon: '/icons/icon-72.png'
        },
        {
          action: 'dismiss', 
          title: 'Dismiss',
          icon: '/icons/icon-72.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Rubber Ducky Live', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'QUEUE_OFFLINE_MESSAGE') {
    queueOfflineMessage(event.data.message);
  }
});

// Queue a message for later sync when online
async function queueOfflineMessage(messageData) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    await new Promise((resolve, reject) => {
      const request = store.add({
        data: messageData,
        timestamp: Date.now(),
        retries: 0
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    
    console.log('💾 Service Worker: Queued offline message');
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync.register('offline-messages');
    }
  } catch (error) {
    console.log('❌ Service Worker: Failed to queue offline message:', error);
  }
}