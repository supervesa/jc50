// test-api.js
async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("VIRHE: GEMINI_API_KEY ei löytynyt ympäristömuuttujista.");
        return;
    }

    console.log("Käytetään avainta:", apiKey.substring(0, 5) + "...");
    
    // Käytetään v1-endpointtia, joka on vakain
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API palautti virheen:", data.error);
        } else {
            console.log("Yhteys onnistui! Saatavilla olevat mallit:");
            data.models.forEach(m => console.log("- " + m.name));
        }
    } catch (err) {
        console.error("Verkkovirhe:", err.message);
    }
}

listModels();