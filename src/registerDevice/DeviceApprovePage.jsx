import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DeviceApprovePage = () => {
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '' });

  const fetchPendingDevices = async () => {
    try {
      const res = await axios.get('http://localhost:8080/devices/pending');
      setDevices(res.data);
    } catch (error) {
      console.error("데이터 로드 실패", error);
    }
  };

  useEffect(() => { fetchPendingDevices(); }, []);

  const handleApproveClick = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location) return alert("필수 항목을 입력해주세요.");
    await axios.post('http://localhost:8080/devices/approve', {
      macId: selectedDevice.macId,
      ...formData
    });
    setIsModalOpen(false);
    fetchPendingDevices();
    alert("승인 완료!");
  };

  return (
    // bg-white와 text-black을 최상단에 명시
    <div className="p-8 w-full min-h-screen bg-white text-black">
      <h1 className="text-3xl font-bold mb-8 text-black">기기 연결 요청 확인</h1>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-black font-bold uppercase text-sm">MAC Address</th>
              <th className="p-4 text-black font-bold uppercase text-sm">IP Address</th>
              <th className="p-4 text-black font-bold uppercase text-sm text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-black">{device.macId}</td>
                <td className="p-4 text-black">{device.ipAddress}</td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleApproveClick(device)} 
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    승인
                  </button>
                  <button 
                    onClick={() => {/* 거절로직 */}} 
                    className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    거절
                  </button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan="3" className="p-12 text-center text-black font-medium">
                  현재 대기 중인 요청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 업그레이드된 모달(팝업) 창 */}
      {isModalOpen && (
        // 💡 bg-opacity-50 대신 bg-black/50 사용, backdrop-blur-sm으로 뒷배경을 흐리게!
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          
          {/* 💡 animate-bounce나 팝업 애니메이션 효과를 주면 더 좋습니다 */}
          <div className="bg-white p-8 rounded-2xl w-[400px] shadow-2xl border border-gray-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">기기 승인</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>
            
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-6 font-mono font-bold">
              대상 MAC: {selectedDevice?.macId}
            </p>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">기기 별명</label>
                <input 
                  className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  placeholder="예: 북악관 메인 센서"
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">설치 위치</label>
                <input 
                  className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  placeholder="예: 2층 205호"
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full">
                취소
              </button>
              <button onClick={handleSubmit} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 w-full">
                최종 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceApprovePage;