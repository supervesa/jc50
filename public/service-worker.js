// HUOM: Tämä tiedosto on erillinen React-koodista, eikä siinä ole pääsyä esim. React-tilaan.

self.addEventListener('push', function(event) {
  let pushData = { title: 'Tiedusteluviesti', body: 'Sinulle on uusi viesti tai tehtävä.' };

  if (event.data) {
    // Puretaan salattu viesti (payload)
    try {
      pushData = event.data.json();
    } catch (e) {
      // Jos viesti ei ole JSONia (esim. yksinkertainen teksti)
      pushData.body = event.data.text();
    }
  }

  const options = {
    body: pushData.body,
    icon: '/logo192.png', // Korvaa omalla ikonilla
    badge: '/badge.png',  // Pienempi kuvake
    vibrate: [100, 50, 100],
    data: {
      url: pushData.url || '/', // Mihin navigoidaan klikattaessa
      time: new Date().toString(),
    }
  };

  // Näytä ilmoitus
  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

// Kun käyttäjä klikkaa ilmoitusta
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Avaa tai tuo sovellus etualalle ja navigoi oikeaan paikkaan
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Tärkeää: Tässä tiedostossa ei tarvita mitään muuta.