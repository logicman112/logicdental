
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const LogicChatbot: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: '안녕! 나는 너의 든든한 이빨 지킴이 로직이야!\n\n평소 치아 고민이나 양치 습관에 대해 궁금한 게 있다면 뭐든지 물어봐줘! 내가 친절하게 설명해줄게! 🦷✨' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `당신은 '로직이'라는 이름의 천재적이고 친절한 치과 전문가 챗봇입니다.
          
          [대화 원칙]
          1. 'ai' 혹은 '인공지능'이라는 단어를 언급하지 마세요. 또한 '의학적 고지'나 '참조용'이라는 경고 문구를 대화 중에 절대 포함하지 마세요 (홈 화면에 이미 기재되어 있습니다).
          2. 매우 친근하고 다정한 말투(~했어, ~야)를 사용하세요.
          3. 너무 전문적인 용어보다는 초등학생도 이해할 수 있을 만큼 쉽게 설명하세요.
          4. 시안성을 위해 가독성 좋게 적절히 줄바꿈을 자주 해주세요 (특히 긴 설명일 경우).
          5. 이모지를 적절히 섞어서 생동감 있게 대화하세요.`,
        }
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.text || '미안, 잠시 딴생각을 했나 봐! 다시 한번 말해줄래? 😅' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: '오류가 났어! 양치하고 다시 시도해보는 건 어때? 🪥' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-48">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[11px] font-[1000] text-white mb-2 uppercase tracking-widest px-4 opacity-70">
              {msg.role === 'user' ? 'You' : 'Logic AI Expert'}
            </span>
            <div className={`max-w-[90%] p-7 rounded-[3rem] text-lg font-black leading-relaxed shadow-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none border-2 border-white/20' 
                : 'bg-white/15 text-white rounded-tl-none border-2 border-white/10 backdrop-blur-xl'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-[1000] text-white mb-2 uppercase tracking-widest px-4 opacity-70">Logic is thinking...</span>
            <div className="bg-white/10 p-6 rounded-[2rem] shadow-xl rounded-tl-none flex space-x-2 border border-white/20">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="fixed bottom-[110px] left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-2xl mx-auto flex items-center space-x-3 bg-white/20 backdrop-blur-3xl rounded-[3rem] p-3 border-2 border-white/20 shadow-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="로직이에게 물어보기..."
            className="flex-1 bg-transparent border-none rounded-2xl px-6 py-4 text-white placeholder-white/40 font-black text-lg focus:ring-0 outline-none"
          />
          <button onClick={handleSend} className="bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl active:scale-90 transition-transform flex items-center justify-center border-2 border-white/20">
            <svg className="w-8 h-8 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogicChatbot;
