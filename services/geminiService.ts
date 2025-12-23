// 1. 라이브러리를 '웹용 표준'으로 변경
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisResponse } from "../types";

export const analyzeDentalImages = async (upperBase64: string, lowerBase64: string): Promise<AnalysisResponse> => {
  
  // [디버깅용] 키가 제대로 들어오는지 콘솔에 찍어서 확인 (보안상 앞 5자리만)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("Current API Key:", apiKey ? apiKey.substring(0, 5) + "..." : "MISSING");

  if (!apiKey) {
    throw new Error("API Key가 환경변수에서 로드되지 않았습니다.");
  }

  // 2. 웹용 SDK 초기화
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 3. 모델명 정확하게 지정 (gemini-1.5-flash)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          scalingRequired: { type: SchemaType.BOOLEAN },
          scalingUrgency: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
          sections: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING, enum: ['observation', 'recommendation', 'warning'] }
              },
              required: ["title", "content", "type"]
            }
          }
        },
        required: ["summary", "scalingRequired", "scalingUrgency", "sections"]
      }
    }
  });

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
    // 4. 요청 보내기 (웹용 SDK 문법으로 변경됨)
    const result = await model.generateContent([
      systemInstruction, // 시스템 지시사항을 첫 번째 파트로 포함
      { inlineData: { mimeType: 'image/jpeg', data: upperBase64.split(',')[1] } },
      { inlineData: { mimeType: 'image/jpeg', data: lowerBase64.split(',')[1] } },
      "로직이야! 내 치아 사진 분석해줘!"
    ]);

    const responseText = result.response.text();
    return JSON.parse(responseText) as AnalysisResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
