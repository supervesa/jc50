/* public/sw.js */

const CACHE_NAME = 'jclub-cache-v1';

// 1. Asennus: Tämä tapahtuu heti kun selain näkee tiedoston
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Pakottaa uuden workerin heti käyttöön
});

// 2. Aktivointi: Siivotaan vanhat (jos tarvetta) ja otetaan ohjat
self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

// 3. Fetch: TÄMÄ ON TÄRKEIN. 
// PWA vaatii, että kuuntelet 'fetch'-tapahtumaa.
// Tässä versiossa emme cacheta mitään (jotta kehitys on helpompaa),
// vaan haemme kaiken suoraan netistä.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});