import { supabase } from '../lib/supabaseClient';

// VAPID JULKINEN AVAIN (Varmista että tämä on se, jonka loit aiemmin!)
const VAPID_PUBLIC_KEY = 'BB7wp3NXFr0r3gWAOGyenJK0-zOhWMxhMDWedgzRASTbPSgoLaMY8XqITRIeDIUKnShsBSftcoGaRYq8WXRxYjM'; 

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUser(guestId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push-ilmoituksia ei tueta.");
    alert("Selaimesi ei tue ilmoituksia.");
    return;
  }

  try {
    // 1. Rekisteröi Service Worker
    await navigator.serviceWorker.register('/service-worker.js');

    // 2. ODOTA, että se on varmasti valmis (TÄMÄ PUUTTUI AIEMMIN)
    const registration = await navigator.serviceWorker.ready;

    // 3. Pyydä lupaa käyttäjältä
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Ilmoitukset estetty. Käy selaimen asetuksissa sallimassa ne.');
      return;
    }

    // 4. Luo tilausavain
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    // 5. Tallenna avain Supabaseen
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        guest_id: guestId,
        subscription_json: subscription,
      }, { onConflict: 'guest_id' });

    if (error) {
      console.error('Tilausavaimen tallennus epäonnistui:', error);
      alert('Virhe tallennuksessa: ' + error.message);
    } else {
      console.log('Tilaus tallennettu onnistuneesti Supabaseen.');
      alert('Ilmoitukset käytössä! 🚀');
    }

  } catch (err) {
    console.error('Virhe ilmoitusten tilaamisessa:', err);
    alert('Jotain meni pieleen: ' + err.message);
  }
}