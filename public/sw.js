/* public/sw.js - THE KILL SWITCH */

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Pakottaa tämän uuden version heti käyttöön
});

self.addEventListener('activate', (event) => {
  // TÄRKEÄ: Poistaa kaikki vanhat välimuistit
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    })
  );
  // Ottaa komennon välittömästi kaikilta asiakkailta
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ei tehdä mitään, päästetään kaikki läpi suoraan verkkoon
  return;
});