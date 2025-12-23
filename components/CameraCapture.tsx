
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { audioService } from '../services/audioService';

interface CameraCaptureProps {
  label: string;
  onCapture: (base64: string) => void;
  onBack: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ label, onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('카메라를 시작할 수 없습니다. 앨범 기능을 이용해주세요.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  const handleAlbumClick = () => {
    audioService.playTap();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full space-y-6 animate-in fade-in duration-500 bg-black">
      <div className="flex items-center justify-between w-full px-8 pt-8">
        <button onClick={() => { audioService.playTap(); onBack(); }} className="p-3 bg-white/10 rounded-[1.2rem] border border-white/5 text-white">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">{label} 촬영</h2>
        <div className="w-12"></div>
      </div>

      <div className="relative w-full aspect-[3/4] bg-slate-950 rounded-[4rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] border-[4px] border-white/10 mx-6">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center space-y-6">
            <span className="text-6xl">📸</span>
            <p className="font-bold text-slate-400 leading-relaxed">{error}</p>
            <button 
              onClick={handleAlbumClick}
              className="bg-white text-black px-8 py-4 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-transform"
            >
              앨범에서 사진 선택
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* High Contrast Medical Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-80 border-[3px] border-blue-500/60 rounded-[5rem] relative shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Target Area</div>
                <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] rounded-[5rem]"></div>
              </div>
              <div className="mt-10 bg-white/10 backdrop-blur-xl text-white px-6 py-3 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] border border-white/10 uppercase">
                Focus on the teeth surface
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-center w-full px-10 pb-12 space-x-10">
        <button
          onClick={handleAlbumClick}
          className="w-16 h-16 bg-white/5 rounded-3xl shadow-xl border border-white/10 flex items-center justify-center text-3xl active:scale-90 transition-transform hover:bg-white/10"
        >
          🖼️
        </button>

        <button
          onClick={handleCapture}
          disabled={!!error}
          className={`w-28 h-28 bg-white/5 border-[10px] border-white/10 rounded-full shadow-2xl flex items-center justify-center transition-all ${error ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)]"></div>
        </button>

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
        
        <div className="w-16 h-16"></div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
