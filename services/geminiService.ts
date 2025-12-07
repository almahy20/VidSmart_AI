import { GoogleGenAI, Type } from "@google/genai";

// ---------------------------------------------------------
// إعداد مفتاح API
// ---------------------------------------------------------

// المفتاح الذي قدمته (تم تحديثه)
const USER_PROVIDED_KEY = "AIzaSyDIqoKnMDnq5rPSDLtk9rg9jv0Lr0bBUEg";

// نستخدم process.env.API_KEY إذا وجد، وإلا نستخدم المفتاح المباشر
// .trim() مهمة جداً لإزالة أي مسافات زائدة قد تسبب خطأ "Invalid Key"
const API_KEY = (process.env.API_KEY || USER_PROVIDED_KEY || "").trim();

// طباعة للتحقق في الـ Console
console.log(`Gemini Service Init. Key Length: ${API_KEY.length}`);

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are an intelligent video assistant specialized in analyzing visual content for an Arabic audience.
Your task is to analyze the provided image (video frame or thumbnail) or text info and provide a structured summary in Arabic.

Output must be strictly JSON with the following fields:
1. title: A short, catchy title (max 6 words).
2. description: A very brief summary (1-2 sentences).
3. fullAnalysis: A detailed description covering key topics, main points, and target audience (bullet points allowed).

Tone: Professional, helpful, and concise. Language: Arabic.
IMPORTANT: Return ONLY raw JSON. Do not wrap in markdown code blocks.
`;

export interface ApiKeyStatus {
    isValid: boolean;
    error?: string;
}

export const validateApiKey = async (): Promise<ApiKeyStatus> => {
  if (!API_KEY) {
      console.error("Validation failed: No API Key found");
      return { isValid: false, error: "المفتاح مفقود" };
  }
  
  try {
    console.log("Validating API Key with Google servers...");
    // تجربة استدعاء بسيط جداً للتحقق من الصلاحية
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: 'ping' }] },
      config: { maxOutputTokens: 1 }
    });
    console.log("API Key validation successful ✅");
    return { isValid: true };
  } catch (error: any) {
    console.warn("API Key validation failed ❌", error);
    
    let msg = "خطأ غير معروف";
    if (error.message?.includes('403') || error.message?.includes('API key')) {
        msg = "المفتاح غير صالح (403)";
    } else if (error.message?.includes('Failed to fetch')) {
        msg = "خطأ في الاتصال بالإنترنت";
    } else if (error.message?.includes('400')) {
        msg = "طلب غير صالح (400)";
    }
    
    return { isValid: false, error: msg };
  }
};

export const analyzeVideoContent = async (
  imageBase64: string | null,
  contextText: string = ""
): Promise<{ title: string; description: string; fullAnalysis: string }> => {
  if (!API_KEY) {
    return {
      title: "مفتاح API مفقود",
      description: "لم يتم العثور على مفتاح API.",
      fullAnalysis: "يرجى إضافة المفتاح في ملف services/geminiService.ts"
    };
  }

  try {
    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    if (contextText) {
      parts.push({
        text: `Context/URL/Title: ${contextText}. Please analyze the visual content or infer from the context provided.`
      });
    }

    if (parts.length === 0) {
      throw new Error("No content to analyze");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            fullAnalysis: { type: Type.STRING },
          },
          required: ["title", "description", "fullAnalysis"],
        },
      },
    });

    let text = response.text || "{}";
    
    try {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const result = JSON.parse(text);
      return result;
    } catch (parseError) {
        console.error("JSON Parse Error. Raw Text:", text);
        return {
            title: "فشل تحليل الرد",
            description: "تم استلام رد ولكن تنسيقه غير صحيح.",
            fullAnalysis: `النص الخام المستلم: ${text.substring(0, 100)}...`
        };
    }

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    
    let errorTitle = "تحليل غير متاح";
    let errorDesc = "حدث خطأ أثناء محاولة تحليل هذا المحتوى.";
    let errorFull = `تفاصيل الخطأ: ${error.message}`;

    if (error.message?.includes('400')) {
        errorTitle = "ملف غير مدعوم";
        errorDesc = "حجم الصورة أو الطلب غير مقبول.";
    } else if (error.message?.includes('403') || error.message?.includes('API key')) {
        errorTitle = "خطأ في مفتاح API";
        errorDesc = "المفتاح المستخدم غير صالح.";
    } else if (error.message?.includes('Failed to fetch')) {
        errorTitle = "خطأ في الاتصال";
        errorDesc = "يرجى التحقق من اتصال الإنترنت.";
    } else if (error.message?.includes('503')) {
        errorTitle = "الخدمة مشغولة";
        errorDesc = "يرجى المحاولة بعد قليل.";
    }

    return {
      title: errorTitle,
      description: errorDesc,
      fullAnalysis: errorFull
    };
  }
};