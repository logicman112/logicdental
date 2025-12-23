
import React from 'react';
import { AnalysisResponse } from '../types';
import { audioService } from '../services/audioService';

interface AnalysisResultViewProps {
  result: AnalysisResponse;
  images: { upper: string | null; lower: string | null };
  onReset: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, images, onReset }) => {
  const urgencyColors = {
    low: 'bg-green-500/20 text-green-300 border-green-500/50',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    high: 'bg-red-600/40 text-red-200 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
  };

  const urgencyLabels = {
    low: '양호한 수준',
    medium: '6개월 내 권장',
    high: '즉시 치과 방문 필요'
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10 pb-48 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Premium Dark Medical Header */}
      <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] shadow-2xl p-10 border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="text-[12rem] text-white">🏥</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <span className="bg-blue-600 text-white text-[11px] font-[1000] px-3 py-1.5 rounded-lg uppercase tracking-[0.2em]">Diagnostic Report</span>
            <div className="h-0.5 w-12 bg-white/40"></div>
            <span className="text-white text-[11px] font-black opacity-80">VER 2.5 PRO</span>
          </div>
          <h2 className="text-4xl font-[1000] text-white mb-6 tracking-tight leading-tight">천재 치과의사<br/>로직이의 정밀 리포트</h2>
          <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
            <p className="text-white leading-relaxed font-black text-lg italic opacity-100">"{result.summary}"</p>
          </div>
        </div>
      </div>

      {/* Scaling Analysis Grid */}
      <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/20 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="w-full flex justify-between items-center px-4">
          <span className="text-[12px] font-[1000] text-white uppercase tracking-[0.3em] opacity-80">Scalability Analysis</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${result.scalingRequired ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className={`${result.scalingRequired ? 'text-red-400' : 'text-green-400'} text-xs font-black uppercase tracking-widest`}>
              {result.scalingRequired ? 'Action Required' : 'Status Clear'}
            </span>
          </div>
        </div>
        
        <div className={`w-full py-7 rounded-3xl border-2 font-[1000] text-2xl flex flex-col items-center justify-center space-y-2 ${urgencyColors[result.scalingUrgency]}`}>
          <span className="text-sm opacity-100 uppercase tracking-widest font-black text-white">{result.scalingRequired ? '⚠️ 스케일링 권고' : '✨ 관리 상태 최상'}</span>
          <span className="text-4xl">{result.scalingRequired ? urgencyLabels[result.scalingUrgency] : '치석 걱정 없어요!'}</span>
        </div>
        <p className="text-[11px] text-white font-[1000] uppercase tracking-widest opacity-60">Logic-AI engine specialized diagnosis</p>
      </div>

      {/* Captured Clinical Images */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-[11px] font-[1000] text-white uppercase tracking-[0.3em] px-3 opacity-80">Maxillary Arch</p>
          <div className="aspect-square rounded-[2.5rem] overflow-hidden border-2 border-white/20 shadow-2xl group transition-transform hover:scale-[1.05]">
            <img src={images.upper || ''} className="w-full h-full object-cover grayscale-0 transition-all" alt="Upper" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-[1000] text-white uppercase tracking-[0.3em] px-3 opacity-80">Mandibular Arch</p>
          <div className="aspect-square rounded-[2.5rem] overflow-hidden border-2 border-white/20 shadow-2xl group transition-transform hover:scale-[1.05]">
            <img src={images.lower || ''} className="w-full h-full object-cover grayscale-0 transition-all" alt="Lower" />
          </div>
        </div>
      </div>

      {/* Expert Analysis Details */}
      <div className="space-y-6">
        {result.sections.map((section, idx) => (
          <div 
            key={idx} 
            className={`group p-8 rounded-[3rem] border-2 transition-all hover:bg-white/10 ${
              section.type === 'warning' ? 'bg-red-600/20 border-red-500/40' : 
              section.type === 'recommendation' ? 'bg-blue-600/20 border-blue-500/40' : 
              'bg-white/10 border-white/20'
            }`}
          >
            <div className="flex items-center space-x-4 mb-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                section.type === 'warning' ? 'bg-red-500 text-white' : 
                section.type === 'recommendation' ? 'bg-blue-500 text-white' : 
                'bg-white text-black'
              }`}>
                {section.type === 'warning' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                {section.type === 'recommendation' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                {section.type === 'observation' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              </div>
              <h3 className="font-[1000] text-white text-2xl tracking-tight">{section.title}</h3>
            </div>
            <p className="text-white text-lg font-bold leading-relaxed whitespace-pre-wrap pl-1 opacity-100">{section.content}</p>
          </div>
        ))}
      </div>

      {/* Professional Footer */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-center border-2 border-white/20 shadow-2xl relative z-10">
        <div className="flex flex-col items-center space-y-6">
          <span className="text-5xl">🔬</span>
          <h4 className="font-black text-white text-2xl uppercase tracking-widest">Medical Disclaimer</h4>
          <p className="text-white text-base font-bold leading-relaxed max-w-md mx-auto opacity-80">
            본 리포트는 인공지능에 기반한 시각적 분석입니다. 방사선 진단 및 물리적 검사가 제외되어 있으므로, 반드시 전문의를 통해 확진을 받으시기 바랍니다.
          </p>
        </div>
      </div>

      <button
        onClick={() => { audioService.playTap(); onReset(); }}
        className="w-full py-8 bg-white text-black rounded-[3rem] font-[1000] text-2xl shadow-[0_20px_60px_rgba(255,255,255,0.2)] active:scale-95 transition-all transform flex items-center justify-center space-x-4 border-4 border-black/10"
      >
        <span>완료 및 다시하기</span>
        <span className="text-3xl">🏠</span>
      </button>
    </div>
  );
};

export default AnalysisResultView;
