import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisResponse } from "../types";

export const analyzeDentalImages = async (upperBase64: string, lowerBase64: string): Promise<AnalysisResponse> => {
  // 1. API 키 확인 (Vite 환경에서는 이렇게 가져와야 합니다)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key가 없습니다. .env 파일을 확인해주세요.");
  }

  // 2. 라이브러리 초기화
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 3. 모델 설정 (여기가 문제였습니다. 1.5 Flash로 수정했습니다)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // gemini-3 (X) -> gemini-1.5-flash (O)
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
    딱딱한 의사 선생님이 아니라, 동네에서 제일 친절하고 실력 좋은 형/누나 같은 느낌으로 말해주세요.
    제공된 치아 사진(상악/하악)을 보고 분석 결과를 알려주세요.

    [분석 원칙]
    1. 말투: "~했어", "~야" 같은 반말과 존댓말이 섞인 듯한 아주 친근한 어투를 사용하세요.
    2. 가독성: 줄바꿈을 아주 자주 해서 시안성을 높여주세요. 한 문장이 너무 길지 않게 해주세요.
    3. 이모지: 이모지를 풍부하게 섞어서 상황을 귀엽게 설명하세요.
    4. 스케일링 진단: 치석 상태를 보고 '당장 가야 할지' 아니면 '조금 더 관리해도 될지'를 명확히 짚어주세요.
  `;

  try {
    // 4. 요청 보내기
    const result = await model.generateContent([
      systemInstruction, 
      { inlineData: { mimeType: 'image/jpeg', data: upperBase64.split(',')[1] } },
      { inlineData: { mimeType: 'image/jpeg', data: lowerBase64.split(',')[1] } },
      "로직이야! 여기 내 치아 사진 두 장 보낼게. 어디가 아픈지, 뭘 해야 하는지 쉽게 좀 알려줘!"
    ]);

    // 5. 결과 반환
    const responseText = result.response.text();
    return JSON.parse(responseText) as AnalysisResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
