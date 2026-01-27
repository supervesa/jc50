/* public/sw.js */

// VAIHDA TÄMÄ NIMI (esim. v2), se pakottaa selaimen lataamaan workerin uudestaan
const CACHE_NAME = 'jclub-cache-v2-ios-fix';

self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  // Tämä varmistaa että uusi worker ottaa vallan heti
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Poistetaan vanhat sotkemasta
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Passiivinen fetch (ei riko Supabasea)
self.addEventListener('fetch', (event) => {
  return; 
});