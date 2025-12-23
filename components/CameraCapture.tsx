
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
  label: string;
  tip: string;
  onCapture: (base64: string) => void;
  onBack: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ label, tip, onCapture, onBack }) => {
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
      setError('카메라 시작 실패. 앨범 사진을 사용해주세요.');
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
        onCapture(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onCapture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full space-y-6 bg-black">
      <div className="flex items-center justify-between w-full px-8 pt-8">
        <button onClick={onBack} className="p-3 bg-white/10 rounded-[1.2rem] text-white">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-black text-white">{label}</h2>
        <div className="w-12"></div>
      </div>
      <div className="relative w-full aspect-[3/4] bg-slate-950 rounded-[4rem] overflow-hidden border-[4px] border-white/10 mx-6">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center space-y-6">
            <p className="font-bold text-slate-400">{error}</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-8 py-4 rounded-[2rem] font-black">앨범에서 선택</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-72 h-40 border-[3px] border-dashed border-blue-500/60 rounded-[5rem]"></div>
              <div className="mt-8 bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-[1.5rem] text-center border border-white/20">
                <p className="text-sm font-black text-blue-300">💡 촬영 꿀팁</p>
                <p className="text-base font-black mt-1">{tip}</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-center w-full px-10 pb-12 space-x-10">
        <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-3xl">🖼️</button>
        <button onClick={handleCapture} disabled={!!error} className={`w-28 h-28 bg-white/5 border-[10px] border-white/10 rounded-full flex items-center justify-center ${error ? 'opacity-30' : 'active:scale-90'}`}>
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="w-16 h-16"></div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
