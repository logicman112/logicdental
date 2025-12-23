
import React, { useState, useEffect } from 'react';
import { CaptureStep, CapturedImages, AnalysisResponse, BrushingHistory, BrushingRecord, ActiveTab, DiagnosisRecord } from './types';
import CameraCapture from './components/CameraCapture';
import AnalysisResultView from './components/AnalysisResultView';
import BrushingTracker from './components/BrushingTracker';
import LogicChatbot from './components/LogicChatbot';
import { analyzeDentalImages } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<CaptureStep>('INITIAL');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [historyTab, setHistoryTab] = useState<'brushing' | 'diagnosis'>('brushing');
  const [images, setImages] = useState<CapturedImages>({ upper: null, lower: null });
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedPastRecord, setSelectedPastRecord] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipCategory, setTipCategory] = useState<'food' | 'care' | 'glossary'>('food');
  
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
      return { ...prev, [date]: next };
    });
  };

  const handleStartDiagnosis = () => {
    setStep('TRANSITION');
    setTimeout(() => {
      setStep('UPPER');
    }, 2000);
  };

  const onTabChange = (id: ActiveTab) => {
    setActiveTab(id);
    setSelectedPastRecord(null);
  };

  const startAnalysis = async (finalImages: CapturedImages) => {
    if (!finalImages.upper || !finalImages.lower) return;
    setStep('ANALYZING');
    try {
      const result = await analyzeDentalImages(finalImages.upper, finalImages.lower);
      
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
          <button onClick={() => setHistoryTab('brushing')} className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${historyTab === 'brushing' ? 'bg-blue-600 text-white shadow-lg' : 'text-white'}`}>🪥 양치 다이어리</button>
          <button onClick={() => setHistoryTab('diagnosis')} className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${historyTab === 'diagnosis' ? 'bg-blue-600 text-white shadow-lg' : 'text-white'}`}>🩺 진단 히스토리</button>
        </div>
        {historyTab === 'brushing' ? <BrushingTracker history={brushingHistory} onToggle={handleToggleBrushing} /> : (
          <div className="space-y-4">
            {diagnosisHistory.length === 0 ? <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/20"><p className="text-white/40 font-bold">진단 기록이 없어요!</p></div> : (
              diagnosisHistory.map(record => (
                <button key={record.id} onClick={() => setSelectedPastRecord(record)} className="w-full text-left bg-white/10 p-6 rounded-[2.5rem] border border-white/10 hover:border-blue-500 transition-all active:scale-95 flex items-center justify-between">
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
              <h1 className="text-6xl font-[900] text-white leading-tight tracking-tighter">로직이의<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">이빨살려!</span></h1>
              <p className="text-white font-[1000] text-xl">당신의 미소를 지키는 천재 AI</p>
            </div>
            <div className="w-full space-y-4">
              <button onClick={handleStartDiagnosis} className="group w-full py-7 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-[2.5rem] font-[1000] text-2xl shadow-[0_15px_40px_-10px_rgba(220,38,38,0.8)] active:scale-95 transition-all transform flex items-center justify-center space-x-4 border border-white/20 overflow-hidden">
                <span>진단 시작하기</span>
                <span className="text-4xl inline-block animate-shiver">🥶</span>
              </button>
            </div>
            <div className="mt-16 p-8 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 w-full shadow-2xl relative z-10 text-center">
              <p className="text-white text-base font-[1000] leading-relaxed">오늘도 깨끗하게 양치하고 로직이와 함께 건강한 치아 만들어요! ✨</p>
            </div>
          </div>
        );
      case 'history': return <div className="p-6 space-y-8 pb-40"><h2 className="text-4xl font-black text-white px-2 tracking-tight">관리기록 📝</h2>{renderHistory()}</div>;
      case 'tips': return <div className="p-6 space-y-8 pb-40"><h2 className="text-4xl font-black text-white px-2 tracking-tight">치아 상식 💡</h2><div className="pt-4 text-white font-bold opacity-60 text-center">팁 정보는 준비 중입니다.</div></div>;
      case 'chat': return <div className="h-full pt-2"><LogicChatbot /></div>;
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-black flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden">
      <style>{`
        @keyframes sway { 0%, 100% { transform: translateX(-10px) translateY(0) rotate(-5deg); } 50% { transform: translateX(10px) translateY(-10px) rotate(5deg); } }
        @keyframes zoomInMouth { 0% { transform: scale(0.1); opacity: 0; } 30% { transform: scale(1.5); opacity: 1; } 80% { transform: scale(20); opacity: 1; } 100% { transform: scale(30); opacity: 0; } }
        @keyframes popText { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.8) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes shiver { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
        .animate-sway { animation: sway 3.5s ease-in-out infinite; }
        .animate-zoom-mouth { animation: zoomInMouth 2.2s forwards cubic-bezier(0.7, 0, 0.3, 1); }
        .animate-pop-text { animation: popText 0.8s 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; }
        .animate-shiver { animation: shiver 0.3s infinite; }
        .bg-mesh { background-image: radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.2) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.2) 0, transparent 50%); }
      `}</style>
      <header className="flex-none bg-black/90 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/20 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl">🦷</span></div><span className="font-[1000] text-white text-2xl tracking-tighter">로직이</span></div>
        {step === 'RESULT' && <button onClick={reset} className="text-sm font-black text-white bg-blue-500 px-5 py-2.5 rounded-full uppercase tracking-widest">다시 진단</button>}
      </header>
      <main className="flex-1 overflow-y-auto relative bg-mesh">
        {step === 'INITIAL' && renderContent()}
        {step === 'TRANSITION' && <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"><div className="animate-zoom-mouth text-[180px]">👄</div><div className="animate-pop-text absolute text-8xl font-[1000] text-blue-500">Ready!</div></div>}
        {step === 'UPPER' && <CameraCapture label="1. 윗니 (상악)" tip="모든 윗니가 보이게 찍어주세요" onCapture={(img) => { setImages(prev => ({ ...prev, upper: img })); setStep('LOWER'); }} onBack={() => setStep('INITIAL')} />}
        {step === 'LOWER' && <CameraCapture label="2. 아랫니 (하악)" tip="모든 아랫니가 보이게 찍어주세요" onCapture={(img) => { setImages(prev => ({ ...prev, lower: img })); setStep('PREVIEW'); }} onBack={() => setStep('UPPER')} />}
        {step === 'PREVIEW' && <div className="max-w-md mx-auto p-8 space-y-10 pb-48"><h2 className="text-4xl font-black text-white tracking-tight">촬영 확인 📸</h2><div className="grid grid-cols-1 gap-8">{[{ label: '윗니 (상악)', img: images.upper, step: 'UPPER' }, { label: '아랫니 (하악)', img: images.lower, step: 'LOWER' }].map((item, i) => (<div key={i} className="space-y-4"><div className="flex items-center justify-between px-2"><label className="text-xs font-black text-white uppercase tracking-widest">{item.label}</label><button onClick={() => setStep(item.step as CaptureStep)} className="text-blue-400 text-sm font-black border-b border-blue-400/50">RETAKE</button></div><div className="relative rounded-[3rem] overflow-hidden border-2 border-white/20 aspect-[4/3]"><img src={item.img || ''} className="w-full h-full object-cover" /></div></div>))}</div>{error && <p className="text-white text-sm font-black text-center bg-red-600/50 py-4 rounded-3xl">{error}</p>}<button onClick={() => startAnalysis(images)} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black text-2xl active:scale-95 transition-all">로직이 분석 시작! ✨</button></div>}
        {step === 'ANALYZING' && <div className="flex flex-col items-center justify-center h-full min-h-[75vh] space-y-10 px-10 text-center"><div className="w-40 h-40 border-[12px] border-white/10 border-t-blue-600 rounded-full animate-spin"></div><h3 className="text-4xl font-[1000] text-white">정밀 스캔 중...</h3></div>}
        {step === 'RESULT' && analysis && <AnalysisResultView result={analysis} images={images} onReset={reset} />}
      </main>
      {step === 'INITIAL' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t-2 border-white/20 px-8 py-5 pb-12 z-50">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            {[{ id: 'home', icon: '🏠', label: 'Home' }, { id: 'history', icon: '📅', label: 'History' }, { id: 'tips', icon: '✨', label: 'Tips' }, { id: 'chat', icon: '💬', label: 'Chat' }].map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id as ActiveTab)} className={`flex flex-col items-center space-y-2 px-6 py-2 rounded-3xl transition-all ${activeTab === tab.id ? 'text-white bg-white/20 scale-110' : 'text-white/60 hover:text-white'}`}>
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-[11px] font-[1000] uppercase tracking-widest text-white">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
