/* public/sw.js */

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Aktivoituu heti
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

// PWA vaatii, että tämä funktio on olemassa, jotta asennus onnistuu.
// Jätämme sen tyhjäksi, jotta se EI puutu tietokantahakuihin.
self.addEventListener('fetch', (event) => {
  return; 
});