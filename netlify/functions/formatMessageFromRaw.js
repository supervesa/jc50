import { GoogleGenerativeAI } from "@google/generative-ai";

// Alustetaan Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Käytetään mallia, joka näkyi testissäsi toimivana
const model = genAI.getGenerativeModel({ 
   model: "gemini-2.0-flash-lite" 
}, { apiVersion: 'v1' });

function createFormattingPrompt(rawText, customerState, intent) {
    const char = customerState?.hahmo_konteksti || {};
    const basic = customerState?.perustiedot || {};

    const lore = `
Olet J:CLUB 50 -operaation viestintäupseeri (Vesa Nessling). 
Teema: Neon Gatsby (1920-luvun glamour + Cyberpunk).
Tyyli: Salaperäinen, hienostunut ja agenttihenkinen. 
Käytä termejä: protokolla, tiedonanto, verhottu, agentti, neutralisoida, soluttautua.
`;

    const context = `
VASTAANOTTAJAN TIEDOT:
Nimi: ${basic.nimi || 'Tuntematon'}
Hahmo: ${basic.hahmo || 'Vakioagentti'}
Tausta: ${char.backstory || 'Ei tiedossa'}
Salainen tehtävä: ${char.mission || 'Odottaa aktivointia'}
Avec-status: ${char.is_avec ? 'Saapuu parin kanssa' : 'Yksittäinen operatiivi'}
`;

    let taskInstruction = "";
    if (intent === 'full_message') {
        taskInstruction = "Luo täydellinen sähköpostikutsu. Aloita iskevällä otsikolla. Käytä hahmon salaisuuksia vihjauksina tekstissä.";
    } else if (intent === 'instructions') {
        taskInstruction = "Luo tekniset mutta teeman mukaiset ohjeet järjestelmien (kuten Kommunikaattorin) käyttöön.";
    } else if (intent === 'mystify') {
        taskInstruction = "Muuta annettu raakateksti erittäin kryptiseksi ja vakoojateemaiseksi tiedonannoksi.";
    } else {
        taskInstruction = "Muotoile annettu raakateksti kohteliaaksi mutta mystiseksi agenttiviestiksi.";
    }

    return `
${lore}
${context}

KÄYTTÄJÄN SYÖTE (RAAKATEKSTI):
---
${rawText}
---

OHJEET:
1. ${taskInstruction}
2. Käytä aina tervehdystä: "Agentti ${basic.nimi || basic.hahmo}, oletko valmis?" tai vastaavaa.
3. Päätä viesti aina allekirjoitukseen: "Terveisin,\nVesa Nessling, J:CLUB 50 Viestintäkeskus".

Palauta VAIN lopullinen viestiteksti ilman selittelyjä.
`;
}

export const handler = async function(event, context) {
    // Netlify Dev saattaa lähettää OPTIONS-pyyntöjä
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
    }

    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { rawText, customerState, intent } = JSON.parse(event.body);

        if (!rawText && intent !== 'full_message') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Puuttuva syöte' }) };
        }

        const prompt = createFormattingPrompt(rawText, customerState, intent);
        
        // Generointi (käytetään vakaampaa kutsua)
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const formattedMessage = response.text().trim();

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({ formattedMessage }),
        };
    } catch (error) {
        console.error("Gemini Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};