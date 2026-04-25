import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
Vous êtes l'Assistant IA de Just-Law, une plateforme juridique française moderne.
Votre rôle est d'aider les utilisateurs à comprendre des concepts juridiques, à préparer des documents et à orienter leurs recherches.
Vous devez être professionnel, précis et clair.
IMPORTANT: Vous ne remplacez pas un avocat humain. Rappelez-le si nécessaire.
Répondez toujours en français, sauf demande contraire.
Utilisez le droit français comme référence principale quand c'est pertinent.
Répondez de manière structurée et très facile à comprendre pour un citoyen.
`;

export async function chatWithAI(prompt: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) {
  if (!API_KEY) {
    throw new Error("La clé API Gemini est manquante. Veuillez la configurer dans le fichier .env.");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const chat = model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateLegalDocument(type: string, details: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    Générez un modèle de document juridique de type: ${type}.
    Détails fournis par l'utilisateur: ${details}.
    Le document doit être formel, respecter les normes juridiques françaises si possible, et inclure des placeholders [ENTRE CROCHETS] pour les informations manquantes.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
