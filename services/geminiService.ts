import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, CustomProjectRequest } from "../types";

const parseAIResponse = (text: string | undefined): AIAnalysisResult => {
  try {
    if (!text) {
      throw new Error('Empty response text');
    }
    // Attempt to extract JSON if the model wrapped it in markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    // Fallback default
    return {
      estimatedTimeHours: 3,
      complexityScore: 6,
      suggestedPriceRange: "200€ - 350€",
      technicalNotes: "Analyse partielle. Veuillez vérifier les détails du recouvrement."
    };
  }
};

export const analyzeProjectRequest = async (request: CustomProjectRequest): Promise<AIAnalysisResult> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock data.");
    return {
      estimatedTimeHours: request.isCoverUp ? 5 : 3,
      complexityScore: request.isCoverUp ? 8 : 5,
      suggestedPriceRange: request.isCoverUp ? "450€ - 600€" : "250€ - 400€",
      technicalNotes: request.isCoverUp 
        ? "Attention: Les recouvrements nécessitent une saturation plus élevée et potentiellement plus de temps." 
        : "Zone standard, bonne faisabilité."
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Calcul de base pour l'estimation
  const baseHours = request.sizeCm < 10 ? 2 : request.sizeCm < 20 ? 3 : request.sizeCm < 30 ? 4 : 6;
  const coverUpMultiplier = request.isCoverUp ? 1.5 : 1;
  const estimatedHours = Math.ceil(baseHours * coverUpMultiplier);
  
  // Estimation de prix basée sur tarif horaire moyen (100-150€/h)
  const hourlyRate = 120;
  const basePrice = estimatedHours * hourlyRate;
  const minPrice = Math.round(basePrice * 0.8);
  const maxPrice = Math.round(basePrice * 1.3);
  
  const prompt = `
    Tu es un assistant expert pour un tatoueur professionnel français. Analyse cette demande de projet pour estimer le travail technique :
    
    PARAMÈTRES DU PROJET :
    - Zone du corps : ${request.bodyPart}
    - Taille : ${request.sizeCm} cm
    - Style : ${request.style}
    - Description : ${request.description}
    - Recouvrement (Cover-up) : ${request.isCoverUp ? "OUI (Augmente significativement la complexité)" : "NON"}
    - Premier tatouage : ${request.isFirstTattoo ? "OUI (Prévoir pauses supplémentaires)" : "NON"}
    - Budget Client : ${request.budget ? request.budget + "€" : "Non spécifié"}
    - Nombre d'images de référence : ${request.referenceImageCount}

    ESTIMATION DE BASE :
    - Temps estimé : ${estimatedHours} heures
    - Fourchette de prix : ${minPrice}€ - ${maxPrice}€

    Fournis une analyse technique détaillée en JSON avec :
    1. estimatedTimeHours : nombre d'heures (entre ${estimatedHours} et ${estimatedHours + 2})
    2. complexityScore : score de complexité de 1 à 10 (considère la zone, le style, et si c'est un cover-up)
    3. suggestedPriceRange : fourchette de prix en format "XXX€ - YYY€" (basée sur ${minPrice}€ - ${maxPrice}€ mais ajuste selon la complexité)
    4. technicalNotes : notes techniques en français (mentionne les défis spécifiques : zone douloureuse, cover-up, style complexe, etc.)

    Réponds UNIQUEMENT avec un objet JSON valide.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedTimeHours: { type: Type.NUMBER },
            complexityScore: { type: Type.NUMBER, description: "Score de complexité de 1 à 10" },
            suggestedPriceRange: { type: Type.STRING, description: "Fourchette de prix au format 'XXX€ - YYY€'" },
            technicalNotes: { type: Type.STRING, description: "Notes techniques détaillées en français" }
          },
          required: ["estimatedTimeHours", "complexityScore", "suggestedPriceRange", "technicalNotes"]
        }
      }
    });

    const result = parseAIResponse(response.text || undefined);
    
    // Validation et fallback si nécessaire
    if (!result.estimatedTimeHours || result.estimatedTimeHours < 1) {
      result.estimatedTimeHours = estimatedHours;
    }
    if (!result.complexityScore || result.complexityScore < 1 || result.complexityScore > 10) {
      result.complexityScore = request.isCoverUp ? 8 : 5;
    }
    if (!result.suggestedPriceRange || !result.suggestedPriceRange.includes('€')) {
      result.suggestedPriceRange = `${minPrice}€ - ${maxPrice}€`;
    }
    
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback intelligent basé sur les données du projet
    return {
        estimatedTimeHours: estimatedHours,
        complexityScore: request.isCoverUp ? 8 : Math.min(10, Math.max(3, Math.floor(request.sizeCm / 5))),
        suggestedPriceRange: `${minPrice}€ - ${maxPrice}€`,
        technicalNotes: request.isCoverUp 
          ? "Projet de recouvrement détecté. Nécessite une saturation élevée et potentiellement plusieurs séances. Zone : " + request.bodyPart + "."
          : `Projet ${request.style} sur ${request.bodyPart} de ${request.sizeCm}cm. Estimation basée sur les paramètres fournis.`
    };
  }
};