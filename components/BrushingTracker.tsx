
import React from 'react';
import { BrushingHistory, BrushingRecord } from '../types';
import { audioService } from '../services/audioService';

interface BrushingTrackerProps {
  history: BrushingHistory;
  onToggle: (date: string, type: keyof BrushingRecord) => void;
}

const BrushingTracker: React.FC<BrushingTrackerProps> = ({ history, onToggle }) => {
  const today = new Date();
  const currentDateStr = today.toISOString().split('T')[0];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const handleToggle = (date: string, type: keyof BrushingRecord, isDisabled: boolean) => {
    if (isDisabled) return;
    audioService.playCheck();
    onToggle(date, type);
  };

  return (
    <div className="w-full bg-white/[0.05] backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl border border-white/20">
      <div className="flex items-center justify-between mb-10">
        <h3 className="font-black text-white flex items-center text-2xl">
          <span className="mr-3 text-3xl">🗓️</span> 기록 관리
        </h3>
        <div className="flex flex-col items-end">
          <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20">
            {today.getMonth() + 1}월 {today.getDate()}일
          </span>
          <span className="text-[10px] text-white font-bold mt-2 uppercase tracking-tighter opacity-80">Current: {today.getHours()}:{today.getMinutes().toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="space-y-6">
        {last7Days.map((date) => {
          const record = (history[date] || { morning: false, lunch: false, dinner: false, gargle: false, floss: false }) as BrushingRecord;
          const isToday = date === currentDateStr;
          const displayDate = new Date(date).getDate();
          const isFullBrushing = record.morning && record.lunch && record.dinner;
          
          return (
            <div key={date} className={`relative flex flex-col p-6 rounded-[2.5rem] transition-all overflow-hidden border ${isToday ? 'bg-blue-600/20 border-blue-400 ring-1 ring-blue-500/20' : 'bg-black/40 border-white/10'}`}>
              
              {isFullBrushing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="border-[6px] border-cyan-400 text-cyan-400 font-[1000] text-5xl px-6 py-2 rounded-2xl rotate-[-12deg] uppercase tracking-tight animate-in zoom-in duration-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] bg-black/40 backdrop-blur-sm">
                    PERFECT!
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-blue-400' : 'text-white opacity-60'}`}>
                  {isToday ? 'T O D A Y' : `D A Y ${displayDate}`}
                </span>
                {isFullBrushing && <span className="text-[10px] font-black text-white bg-cyan-600 px-3 py-1 rounded-full border border-white/20">ALL CLEAR</span>}
              </div>
              
              <div className={`grid grid-cols-5 gap-3 transition-opacity ${isFullBrushing ? 'opacity-30' : 'opacity-100'}`}>
                {[
                  { key: 'morning', icon: '☀️', label: 'Morning' },
                  { key: 'lunch', icon: '☁️', label: 'Lunch' },
                  { key: 'dinner', icon: '🌙', label: 'Dinner' },
                  { key: 'gargle', icon: '🌊', label: 'Gargle' },
                  { key: 'floss', icon: '🧵', label: 'Floss' }
                ].map((item) => {
                  const isCore = ['morning', 'lunch', 'dinner'].includes(item.key);
                  const isChecked = record[item.key as keyof BrushingRecord];
                  const shouldDisable = isFullBrushing && isCore;

                  return (
                    <button
                      key={item.key}
                      disabled={shouldDisable}
                      onClick={() => handleToggle(date, item.key as keyof BrushingRecord, shouldDisable)}
                      className={`flex flex-col items-center justify-center py-4 px-1 rounded-3xl transition-all ${
                        isChecked 
                          ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.4)] ring-1 ring-white/50' 
                          : 'bg-white/10 text-white/40 hover:bg-white/20'
                      } ${shouldDisable ? 'cursor-not-allowed grayscale' : 'active:scale-90'}`}
                    >
                      <span className="text-2xl mb-2">{item.icon}</span>
                      <span className={`text-[9px] font-black uppercase tracking-tighter w-full text-center truncate ${isChecked ? 'text-white' : 'text-white/60'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {(Object.values(history) as BrushingRecord[]).filter(r => r.morning && r.lunch && r.dinner).length > 0 && (
        <div className="mt-10 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] border border-white/30 flex items-center space-x-5 shadow-2xl">
          <span className="text-4xl animate-bounce">🏆</span>
          <p className="text-sm text-white font-black leading-relaxed">
            축하드려요! 양치 습관이 완벽합니다. <br/>로직이가 당신의 치아 건강을 보증해요!
          </p>
        </div>
      )}
    </div>
  );
};

export default BrushingTracker;
