
import React, { useState, useEffect } from 'react';
import { CaptureStep, CapturedImages, AnalysisResponse, BrushingHistory, BrushingRecord, ActiveTab, DiagnosisRecord } from './types';
import CameraCapture from './components/CameraCapture';
import AnalysisResultView from './components/AnalysisResultView';
import BrushingTracker from './components/BrushingTracker';
import LogicChatbot from './components/LogicChatbot';
import { analyzeDentalImages } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [step, setStep] = useState<CaptureStep>('INITIAL');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [historyTab, setHistoryTab] = useState<'brushing' | 'diagnosis'>('brushing');
  const [images, setImages] = useState<CapturedImages>({ upper: null, lower: null });
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedPastRecord, setSelectedPastRecord] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipCategory, setTipCategory] = useState<'food' | 'care' | 'glossary'>('food');
  
  // 로그인 없이 핸드폰 브라우저에 저장되는 로컬 데이터
  const [brushingHistory, setBrushingHistory] = useState<BrushingHistory>(() => {
    const saved = localStorage.getItem('logic_brushing_history');
    return saved ? JSON.parse(saved) : {};
  });

  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisRecord[]>(() => {
    const saved = localStorage.getItem('logic_diagnosis_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('logic_brushing_history', JSON.stringify(brushingHistory));
  }, [brushingHistory]);

  useEffect(() => {
    localStorage.setItem('logic_diagnosis_history', JSON.stringify(diagnosisHistory));
  }, [diagnosisHistory]);

  const handleToggleBrushing = (date: string, type: keyof BrushingRecord) => {
    setBrushingHistory(prev => {
      const current = prev[date] || { morning: false, lunch: false, dinner: false, gargle: false, floss: false };
      const next = { ...current, [type]: !current[type] };
      if (next.morning && next.lunch && next.dinner && (!current.morning || !current.lunch || !current.dinner)) {
        audioService.playSuccess();
      }
      return { ...prev, [date]: next };
    });
  };

  const handleStartDiagnosis = () => {
    audioService.playSok();
    setStep('TRANSITION');
    setTimeout(() => {
      setStep('UPPER');
    }, 2000);
  };

  const onTabChange = (id: ActiveTab) => {
    audioService.playTap();
    setActiveTab(id);
    setSelectedPastRecord(null);
  };

  const startAnalysis = async (finalImages: CapturedImages) => {
    if (!finalImages.upper || !finalImages.lower) return;
    setStep('ANALYZING');
    try {
      const result = await analyzeDentalImages(finalImages.upper, finalImages.lower);
      audioService.playSuccess();
      
      const newRecord: DiagnosisRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('ko-KR'),
        images: { ...finalImages },
        analysis: result
      };
      setDiagnosisHistory(prev => [newRecord, ...prev]);
      
      setAnalysis(result);
      setStep('RESULT');
    } catch (err) {
      console.error(err);
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('PREVIEW');
    }
  };

  const reset = () => {
    audioService.playTap();
    setImages({ upper: null, lower: null });
    setAnalysis(null);
    setSelectedPastRecord(null);
    setError(null);
    setStep('INITIAL');
  };

  const renderHistory = () => {
    if (selectedPastRecord) {
      return (
        <div className="animate-in fade-in duration-500">
          <button 
            onClick={() => setSelectedPastRecord(null)}
            className="mb-6 flex items-center text-blue-400 font-black space-x-2"
          >
            <span>← 목록으로 돌아가기</span>
          </button>
          <AnalysisResultView 
            result={selectedPastRecord.analysis} 
            images={selectedPastRecord.images} 
            onReset={() => setSelectedPastRecord(null)} 
          />
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-48">
        <div className="flex bg-white/10 p-2 rounded-full border border-white/20">
          <button 
            onClick={() => setHistoryTab('brushing')}
            className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${historyTab === 'brushing' ? 'bg-blue-600 text-white shadow-lg' : 'text-white'}`}
          >
            🪥 양치 다이어리
          </button>
          <button 
            onClick={() => setHistoryTab('diagnosis')}
            className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${historyTab === 'diagnosis' ? 'bg-blue-600 text-white shadow-lg' : 'text-white'}`}
          >
            🩺 진단 히스토리
          </button>
        </div>

        {historyTab === 'brushing' ? (
          <BrushingTracker history={brushingHistory} onToggle={handleToggleBrushing} />
        ) : (
          <div className="space-y-4">
            {diagnosisHistory.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/20">
                <p className="text-white/40 font-bold">아직 저장된 진단 결과가 없어요!</p>
              </div>
            ) : (
              diagnosisHistory.map(record => (
                <button 
                  key={record.id}
                  onClick={() => { audioService.playTap(); setSelectedPastRecord(record); }}
                  className="w-full text-left bg-white/10 p-6 rounded-[2.5rem] border border-white/10 hover:border-blue-500 transition-all active:scale-95 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{record.date}</p>
                    <p className="text-white font-black line-clamp-1">{record.analysis.summary}</p>
                  </div>
                  <span className="text-2xl">➔</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTips = () => {
    switch(tipCategory) {
      case 'food':
        return (
          <div className="space-y-8 pb-12">
            <div>
              <h3 className="text-2xl font-black text-blue-400 mb-6 px-2 flex items-center">
                <span className="mr-3">✅</span> 치아에 좋은 음식 10
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: '멸치', desc: '칼슘이 풍부해 치아와 뼈를 튼튼하게 해요.' },
                  { name: '치즈', desc: '구강 내 산도를 낮춰 충치 예방에 도움을 줘요.' },
                  { name: '우유', desc: '단백질과 칼슘이 많아 에나멜 형성을 돕습니다.' },
                  { name: '사과', desc: '아삭한 식감이 치태를 제거하는 효과가 있어요.' },
                  { name: '당근', desc: '섬유질이 풍부해 씹는 동안 치아를 닦아줘요.' },
                  { name: '아몬드', desc: '비타민과 인이 풍부해 치아 건강에 좋아요.' },
                  { name: '브로콜리', desc: '철분이 풍부해 산성 환경에서 치아를 보호해요.' },
                  { name: '녹차', desc: '폴리페놀 성분이 세균 번식을 억제합니다.' },
                  { name: '양파', desc: '강력한 항균 성분이 충치균을 박멸해요.' },
                  { name: '물', desc: '입안을 헹구어 음식물 찌꺼기와 산도를 조절해요.' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 p-5 rounded-3xl border border-white/20">
                    <span className="font-black text-white text-lg block mb-1">{idx+1}. {item.name}</span>
                    <p className="text-white text-sm leading-relaxed font-black">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-red-400 mb-6 px-2 flex items-center">
                <span className="mr-3">❌</span> 치아에 나쁜 음식 10
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: '사탕', desc: '당분이 높고 입안에 오래 머물러 치명적이에요.' },
                  { name: '탄산음료', desc: '강한 산성이 법랑질을 직접적으로 부식시켜요.' },
                  { name: '얼음', desc: '딱딱한 얼음을 깨물면 치아 파절의 위험이 커요.' },
                  { name: '말린 과일', desc: '끈적거려서 치아 사이에 잘 끼고 당도가 높아요.' },
                  { name: '술', desc: '침 분비를 줄여 입안을 건조하게 하고 세균을 키워요.' },
                  { name: '커피', desc: '설탕이나 시럽이 없어도 치아 변색을 유발합니다.' },
                  { name: '젤리', desc: '점성이 강해 칫솔질로도 잘 안 닦여 충치를 유발해요.' },
                  { name: '감자칩', desc: '전분이 입안에서 당으로 변해 치아에 달라붙어요.' },
                  { name: '레몬', desc: '강한 산성이 에나멜을 녹여 치아를 예민하게 해요.' },
                  { name: '에너지 드링크', desc: '탄산보다 더 강한 산성과 당분을 포함합니다.' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 p-5 rounded-3xl border border-white/20">
                    <span className="font-black text-white text-lg block mb-1">{idx+1}. {item.name}</span>
                    <p className="text-white text-sm leading-relaxed font-black">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'care':
        return (
          <div className="space-y-8 pb-12">
            {[
              { title: '🦷 치아가 썩었을 때', tips: ['즉시 치과 방문: 통증이 없어도 내부 전이는 매우 빠릅니다.', '과도한 양치 자제: 손상된 부위를 강하게 닦으면 오히려 악화될 수 있어요.', '당분 섭취 즉시 중단: 충치균의 주 먹이인 설탕을 완벽히 차단하세요.'] },
              { title: '🔩 임플란트 시 주의사항', tips: ['치간칫솔 사용 필수: 임플란트 주변에 음식물이 끼지 않게 철저히 관리하세요.', '주기적 정기 검진: 신경이 없어 염증이 생겨도 통증을 못 느낄 수 있습니다.', '금연 및 금주: 잇몸뼈와의 결합을 방해하고 주위염의 주원인이 됩니다.'] },
              { title: '폼나게 치실 쓰는 법', tips: ['치실을 30~40cm 정도로 끊어서 양손 중지에 감으세요.', '치아 사이에 톱질하듯 부드럽게 밀어 넣으세요.', '치아를 C자 모양으로 감싸서 잇몸 안쪽까지 쓸어올려주세요.'] }
            ].map((section, idx) => (
              <div key={idx} className="bg-white/10 p-8 rounded-[3rem] border border-white/20">
                <h4 className="font-[1000] text-white text-2xl mb-6">{section.title}</h4>
                <ul className="space-y-4">
                  {section.tips.map((t, i) => (
                    <li key={i} className="flex items-start text-white text-base font-[1000] leading-relaxed">
                      <span className="text-blue-400 mr-3 mt-1 text-sm">✦</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 'glossary':
        return (
          <div className="grid grid-cols-1 gap-6 pb-12">
            {[
              { name: '스케일링', desc: '치아 표면에 붙은 딱딱한 치석을 물리적으로 제거하는 예방 치료입니다. 연 1-2회 필수예요.' },
              { name: '레진', desc: '충치 부위를 제거한 뒤 치아 색상과 비슷한 고분자 재료로 채우는 간단한 치료입니다.' },
              { name: '인레이', desc: '충치가 클 때 본을 떠서 금이나 세라믹으로 제작한 조각을 끼워 넣는 정밀 치료 방식입니다.' },
              { name: '크라운', desc: '손상이 심한 치아 전체를 금속이나 도자기 재료로 씌워서 치아를 보호하는 보철 치료입니다.' },
              { name: '임플란트', desc: '상실된 치아 부위의 뼈에 인공 뿌리를 심고 그 위에 보철물을 연결하는 인공 치아 시술입니다.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-xl">📘</span>
                  <h4 className="font-black text-white text-xl">{item.name}</h4>
                </div>
                <p className="text-white text-base font-black leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center px-6 pt-16 pb-40">
            <div className="mb-12 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>
              <div className="animate-sway text-[11rem] leading-none drop-shadow-[0_0_50px_rgba(59,130,246,0.6)] relative select-none">🦷</div>
            </div>
            <div className="text-center space-y-6 mb-12 w-full px-4">
              <h1 className="text-6xl font-[900] text-white leading-tight tracking-tighter">
                로직이의<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">이빨살려!</span>
              </h1>
              <p className="text-white font-[1000] text-xl">당신의 미소를 지키는 천재 AI</p>
            </div>
            <div className="w-full space-y-4">
              <button onClick={handleStartDiagnosis} className="group w-full py-7 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-[2.5rem] font-[1000] text-2xl shadow-[0_15px_40px_-10px_rgba(220,38,38,0.8)] active:scale-95 transition-all transform flex items-center justify-center space-x-4 border border-white/20 overflow-hidden">
                <span>충격받을 준비하기</span>
                <span className="text-4xl inline-block animate-shiver">🥶</span>
              </button>
              <p className="text-center text-white font-[1000] text-xs uppercase tracking-widest bg-white/10 py-1 rounded-full border border-white/10">※ AI사용으로 단순 참조용입니다!</p>
            </div>
            <div className="mt-16 p-8 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 w-full shadow-2xl relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl">✨</span>
                <p className="text-blue-300 font-[1000] text-lg uppercase tracking-tight">오늘의 프리미엄 팁</p>
              </div>
              <p className="text-white text-base font-[1000] leading-relaxed">밤 양치 전 치실 사용은 수면 중 세균 번식을 90% 차단합니다. 오늘 밤 로직이와 약속해요!</p>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500 pb-40">
            <h2 className="text-4xl font-black text-white px-2 tracking-tight">관리기록 <span className="text-blue-500">📝</span></h2>
            {renderHistory()}
          </div>
        );
      case 'tips':
        return (
          <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500 pb-40">
            <h2 className="text-4xl font-black text-white px-2 tracking-tight">치아 상식 <span className="text-cyan-400">💡</span></h2>
            <div className="flex space-x-2 bg-white/15 p-2 rounded-full border-2 border-white/20">
              {[{ id: 'food', label: '음식', emoji: '🍎' }, { id: 'care', label: '관리', emoji: '🏥' }, { id: 'glossary', label: '용어정리', emoji: '📚' }].map((cat) => (
                <button key={cat.id} onClick={() => { audioService.playTap(); setTipCategory(cat.id as any); }} className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-full font-[1000] text-sm transition-all ${tipCategory === cat.id ? 'bg-white text-black shadow-lg' : 'text-white hover:bg-white/10'}`}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-4">{renderTips()}</div>
          </div>
        );
      case 'chat':
        return <div className="h-full pt-2"><LogicChatbot /></div>;
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-black flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden">
      <style>{`
        @keyframes sway { 0%, 100% { transform: translateX(-10px) translateY(0) rotate(-5deg); } 50% { transform: translateX(10px) translateY(-10px) rotate(5deg); } }
        @keyframes zoomInMouth { 0% { transform: scale(0.1); opacity: 0; } 30% { transform: scale(1.5); opacity: 1; } 80% { transform: scale(20); opacity: 1; } 100% { transform: scale(30); opacity: 0; } }
        @keyframes popText { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.8) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes shiver { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
        .animate-sway { animation: sway 3.5s ease-in-out infinite; }
        .animate-zoom-mouth { animation: zoomInMouth 2.2s forwards cubic-bezier(0.7, 0, 0.3, 1); }
        .animate-pop-text { animation: popText 0.8s 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; }
        .animate-shiver { animation: shiver 0.3s infinite; }
        .bg-mesh { background-image: radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.2) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.2) 0, transparent 50%); }
      `}</style>

      <header className="flex-none bg-black/90 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/20 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-2xl">🦷</span>
          </div>
          <span className="font-[1000] text-white text-2xl tracking-tighter">로직이</span>
        </div>
        {step === 'RESULT' && <button onClick={reset} className="text-sm font-black text-white bg-blue-500 border border-white/20 px-5 py-2.5 rounded-full uppercase tracking-widest shadow-lg active:scale-90 transition-transform">다시 진단</button>}
      </header>

      <main className="flex-1 overflow-y-auto relative bg-mesh scroll-smooth">
        {step === 'INITIAL' && renderContent()}
        {step === 'TRANSITION' && <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"><div className="animate-zoom-mouth text-[180px] pointer-events-none drop-shadow-[0_0_80px_rgba(255,255,255,0.3)]">👄</div><div className="animate-pop-text absolute text-8xl font-[1000] text-blue-500 drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]">Ready!</div></div>}
        {step === 'UPPER' && <CameraCapture label="1. 윗니 (상악)" tip="모든 윗니가 보이게 찍어주세요" onCapture={(img) => { audioService.playCheck(); setImages(prev => ({ ...prev, upper: img })); setStep('LOWER'); }} onBack={() => setStep('INITIAL')} />}
        {step === 'LOWER' && <CameraCapture label="2. 아랫니 (하악)" tip="모든 아랫니가 보이게 찍어주세요" onCapture={(img) => { audioService.playCheck(); const newImages = { ...images, lower: img }; setImages(newImages); setStep('PREVIEW'); }} onBack={() => setStep('UPPER')} />}
        {step === 'PREVIEW' && <div className="max-w-md mx-auto p-8 space-y-10 animate-in fade-in duration-500 pb-48"><h2 className="text-4xl font-black text-white tracking-tight">촬영 확인 <span className="text-blue-400">📸</span></h2><div className="grid grid-cols-1 gap-8">{[{ label: '윗니 (상악)', img: images.upper, step: 'UPPER' }, { label: '아랫니 (하악)', img: images.lower, step: 'LOWER' }].map((item, i) => (<div key={i} className="space-y-4"><div className="flex items-center justify-between px-2"><label className="text-xs font-black text-white uppercase tracking-widest">{item.label}</label><button onClick={() => { audioService.playTap(); setStep(item.step as CaptureStep); }} className="text-blue-400 text-sm font-black border-b border-blue-400/50">RETAKE</button></div><div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,1)] border-2 border-white/20 aspect-[4/3]"><img src={item.img || ''} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div></div></div>))}</div>{error && <p className="text-white text-sm font-black text-center bg-red-600/50 py-4 rounded-3xl border border-white/20">{error}</p>}<button onClick={() => { audioService.playTap(); startAnalysis(images); }} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black text-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all">로직이 분석 시작! ✨</button></div>}
        {step === 'ANALYZING' && <div className="flex flex-col items-center justify-center h-full min-h-[75vh] space-y-10 px-10 text-center"><div className="relative"><div className="w-40 h-40 border-[12px] border-white/10 border-t-blue-600 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-7xl animate-pulse">🦷</span></div></div><div className="space-y-4"><h3 className="text-4xl font-[1000] text-white tracking-tight">정밀 스캔 중...</h3><p className="text-white font-[1000] text-lg opacity-100">데이터 엔진이 치아와 잇몸을 분석하고 있습니다</p></div></div>}
        {step === 'RESULT' && analysis && <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000"><AnalysisResultView result={analysis} images={images} onReset={reset} /></div>}
      </main>

      {step === 'INITIAL' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t-2 border-white/20 px-8 py-5 pb-12 z-50">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            {[{ id: 'home', icon: '🏠', label: 'Home' }, { id: 'history', icon: '📅', label: 'History' }, { id: 'tips', icon: '✨', label: 'Tips' }, { id: 'chat', icon: '💬', label: 'Chat' }].map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id as ActiveTab)} className={`flex flex-col items-center space-y-2 px-6 py-2 rounded-3xl transition-all duration-300 ${activeTab === tab.id ? 'text-white bg-white/20 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-white/60 hover:text-white'}`}>
                <span className={`text-2xl transition-transform ${activeTab === tab.id ? 'scale-125' : 'grayscale-0 opacity-40'}`}>{tab.icon}</span>
                <span className={`text-[11px] font-[1000] uppercase tracking-widest text-white`}>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
