
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

export const analyzeDentalImages = async (upperBase64: string, lowerBase64: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    당신은 '천재 치과의사 로직이'입니다. 
    딱딱한 의사 선생님이 아니라, 동네에서 제일 친절하고 실력 좋은 형/누나 같은 느낌으로 말해주세요.
    제공된 치아 사진(상악/하악)을 보고 분석 결과를 알려주세요.

    [분석 원칙]
    1. 말투: "~했어", "~야" 같은 반말과 존댓말이 섞인 듯한 아주 친근한 어투를 사용하세요.
    2. 가독성: 줄바꿈을 아주 자주 해서 시안성을 높여주세요. 한 문장이 너무 길지 않게 해주세요.
    3. 이모지: 이모지를 풍부하게 섞어서 상황을 귀엽게 설명하세요.
    4. 스케일링 진단: 치석 상태를 보고 '당장 가야 할지' 아니면 '조금 더 관리해도 될지'를 명확히 짚어주세요.

    [응답 구조]
    - summary: 전체적인 상황을 한눈에 알 수 있는 따뜻한 한마디.
    - scalingRequired: 스케일링 필요 여부 (boolean).
    - scalingUrgency: 필요 시 긴급도 (low, medium, high).
    - sections: 관찰 내용, 추천 치료, 꿀팁을 포함한 상세 섹션들.

    반드시 JSON 형식으로만 응답하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: "로직이야! 여기 내 치아 사진 두 장 보낼게. 어디가 아픈지, 뭘 해야 하는지 쉽게 좀 알려줘!" },
            { inlineData: { mimeType: 'image/jpeg', data: upperBase64.split(',')[1] } },
            { inlineData: { mimeType: 'image/jpeg', data: lowerBase64.split(',')[1] } },
          ]
        }
      ],
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
