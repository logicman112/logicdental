
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeDentalImages = async (upperBase64: string, lowerBase64: string): Promise<AnalysisResponse> => {
  // 고도의 추론이 필요한 진단 작업을 위해 Pro 모델 사용
  const model = 'gemini-1.5-flash';
  
  const systemInstruction = `
    당신은 30년 경력의 세계 최고의 치주과 전문의이자 구강악안면외과 교수인 '천재 치과의사 로직이'입니다.
    제공된 상악 및 하악 이미지를 바탕으로 육안으로 확인 가능한 모든 병적 징후를 정밀 분석하십시오.

    [분석 가이드라인]
    1. 전문성: 단순한 설명을 넘어 치은염(Gingivitis), 치주염(Periodontitis), 법랑질 부식(Enamel Erosion), 초기 우식(Incipient Caries) 등의 의학적 징후를 탐색하십시오.
    2. 스케일링 진단: 치태(Plaque) 및 치석(Calculus)의 침착 정도를 분석하여 스케일링 필요 여부와 긴급도(low, medium, high)를 결정하십시오.
    3. 구체성: 어느 부위(앞니, 어금니 등)에 관리가 필요한지 명시하십시오.
    4. 톤앤매너: 매우 신뢰감 있고 전문적이면서도 사용자가 이해하기 쉽게 설명하십시오. 영어는 쓰지 마십시오.

    [응답 구조]
    - summary: 전체적인 구강 건강 지수와 핵심 총평.
    - scalingRequired: 스케일링이 필요한지 여부 (boolean).
    - scalingUrgency: 필요 시 긴급도 (low, medium, high).
    - sections: 관찰 내용, 치료 권장 사항, 예방 가이드를 포함한 3개 이상의 상세 섹션.

    반드시 JSON 형식으로만 응답하십시오.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "천재 치과의사 로직이님, 환자의 구강 사진(상악/하악)입니다. 정밀 분석을 시작해주세요." },
        { inlineData: { mimeType: 'image/jpeg', data: upperBase64.split(',')[1] } },
        { inlineData: { mimeType: 'image/jpeg', data: lowerBase64.split(',')[1] } },
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
};
