
import React from 'react';
import { BrushingHistory, BrushingRecord } from '../types';

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

  return (
    <div className="w-full bg-white/[0.05] rounded-[3rem] p-8 border border-white/20">
      <div className="flex items-center justify-between mb-10">
        <h3 className="font-black text-white flex items-center text-2xl">🗓️ 기록 관리</h3>
        <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black">{today.getMonth() + 1}월 {today.getDate()}일</span>
      </div>
      <div className="space-y-6">
        {last7Days.map((date) => {
          const record = (history[date] || { morning: false, lunch: false, dinner: false, gargle: false, floss: false }) as BrushingRecord;
          const isToday = date === currentDateStr;
          return (
            <div key={date} className={`flex flex-col p-6 rounded-[2.5rem] border ${isToday ? 'bg-blue-600/20 border-blue-400' : 'bg-black/40 border-white/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-black ${isToday ? 'text-blue-400' : 'text-white opacity-60'}`}>{isToday ? 'T O D A Y' : date}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'morning', icon: '☀️' }, { key: 'lunch', icon: '☁️' }, { key: 'dinner', icon: '🌙' }, { key: 'gargle', icon: '🌊' }, { key: 'floss', icon: '🧵' }
                ].map((item) => (
                  <button key={item.key} onClick={() => onToggle(date, item.key as keyof BrushingRecord)} className={`flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${record[item.key as keyof BrushingRecord] ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'}`}>
                    <span className="text-2xl">{item.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrushingTracker;
