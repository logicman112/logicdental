
import React from 'react';
import { AnalysisResponse } from '../types';

interface AnalysisResultViewProps {
  result: AnalysisResponse;
  images: { upper: string | null; lower: string | null };
  onReset: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, images, onReset }) => {
  const urgencyLabels = { low: '양호함', medium: '6개월 내 권장', high: '즉시 방문 필요' };
  const urgencyColors = {
    low: 'bg-green-500/20 text-green-300 border-green-500/50',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    high: 'bg-red-600/40 text-red-200 border-red-500/50 shadow-2xl'
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10 pb-48 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-10 border border-white/20">
        <h2 className="text-4xl font-[1000] text-white mb-6">로직이의 정밀 리포트</h2>
        <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
          <p className="text-white text-lg font-black italic">"{result.summary}"</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-[3rem] p-8 border border-white/20 shadow-2xl text-center space-y-6">
        <div className={`w-full py-7 rounded-3xl border-2 font-[1000] text-2xl ${urgencyColors[result.scalingUrgency]}`}>
          <span className="text-sm uppercase tracking-widest text-white block mb-2">{result.scalingRequired ? '⚠️ 스케일링 권고' : '✨ 관리 우수'}</span>
          <span className="text-4xl">{result.scalingRequired ? urgencyLabels[result.scalingUrgency] : '걱정 없어요!'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[{ label: '상악', img: images.upper }, { label: '하악', img: images.lower }].map((item, i) => (
          <div key={i} className="space-y-3">
            <p className="text-[11px] font-[1000] text-white uppercase tracking-widest text-center">{item.label}</p>
            <div className="aspect-square rounded-[2.5rem] overflow-hidden border-2 border-white/20">
              <img src={item.img || ''} className="w-full h-full object-cover" alt={item.label} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {result.sections.map((section, idx) => (
          <div key={idx} className={`p-8 rounded-[3rem] border-2 bg-white/10 border-white/20`}>
            <h3 className="font-[1000] text-white text-2xl mb-4">{section.title}</h3>
            <p className="text-white text-lg font-bold leading-relaxed whitespace-pre-wrap">{section.content}</p>
          </div>
        ))}
      </div>

      <button onClick={onReset} className="w-full py-8 bg-white text-black rounded-[3rem] font-[1000] text-2xl active:scale-95 transition-all">완료 및 돌아가기 🏠</button>
    </div>
  );
};

export default AnalysisResultView;
