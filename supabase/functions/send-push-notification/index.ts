import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// KORJAUS: Käytetään virallista NPM-pakettia. Tämä on vakain tapa.
import webpush from "npm:web-push@3.6.3"

console.log("Funktio (NPM-compat) käynnistyy...");

serve(async (req: Request) => {
  try {
    // ---------------------------------------------------------
    // LIITÄ TÄHÄN TAAS OMAT AVAIMESI JA URLIT
    // ---------------------------------------------------------
   

    // Asetetaan VAPID (kuten alkuperäisessä versiossa)
    webpush.setVapidDetails(
      'mailto:sinun@email.com',
      publicKey,
      privateKey
    );

    const bodyData = await req.json().catch(() => null);
    const message = bodyData?.message || "Oletusviesti";

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_json')
      .not('subscription_json', 'is', null);

    if (error) throw error;

    console.log(`Löytyi ${subscriptions?.length} tilaajaa.`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "Ei tilaajia" }), { headers: { "Content-Type": "application/json" } });
    }

    const promises = subscriptions.map((sub) => {
      // Käytetään standardia webpush.sendNotification
      return webpush.sendNotification(
        sub.subscription_json, 
        JSON.stringify({ title: 'Uusi ilmoitus', body: message })
      )
      .catch((err: any) => {
          console.error('Lähetysvirhe:', err);
          return err;
      });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("KRIITTINEN VIRHE:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});