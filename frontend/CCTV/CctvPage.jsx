import React from 'react';

const CctvPage = () => {
  // 라즈베리 파이의 고정 IP
  const RPI_IP = "192.168.137.111"; 

  return (
    <div className="p-8 w-full min-h-screen bg-white text-black">
      <h1 className="text-3xl font-bold mb-8 text-black">실시간 CCTV 대시보드</h1>
      
      {/* 영상 플레이어를 감싸는 예쁜 카드 UI */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden w-full max-w-5xl aspect-video">
        <iframe 
          src={`http://${RPI_IP}:8889/cam`} 
          width="100%" 
          height="100%" 
          frameBorder="0"
          scrolling="no"
          title="CCTV Stream"
          className="w-full h-full bg-gray-900" // 영상 로딩 전 까만 배경
        ></iframe>
      </div>
    </div>
  );
};

export default CctvPage;