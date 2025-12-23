
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

export const analyzeDentalImages = async (upperBase64: string, lowerBase64: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  // 'gemini-flash-latest'는 Gemini 1.5 Flash 모델의 최신 배포 버전입니다.
  const model = 'gemini-flash-latest';
  
  const cleanBase64 = (str: string) => {
    if (!str) return "";
    return str.includes(',') ? str.split(',')[1] : str;
  };

  const systemInstruction = `
    당신은 '천재 치과의사 로직이'입니다. 
    딱딱한 의사가 아니라 동네에서 제일 실력 좋고 쿨한 형/누나처럼 말해주세요.
    제공된 상악/하악 치아 사진을 정밀 분석해주세요.

    [응답 규칙]
    1. 말투: "~했어", "~야" 같은 반말/구어체 사용.
    2. 가독성: 1-2문장마다 줄바꿈 필수.
    3. 이모지: 적극적으로 사용.
    4. 반드시 JSON 형식으로만 응답할 것.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: "로직이야! 내 치아 사진 분석해줘!" },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(upperBase64) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(lowerBase64) } },
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            scalingRequired: { type: Type.BOOLEAN },
            scalingUrgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['observation', 'recommendation', 'warning'] }
                },
                required: ["title", "content", "type"]
              }
            }
          },
          required: ["summary", "scalingRequired", "scalingUrgency", "sections"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as AnalysisResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
