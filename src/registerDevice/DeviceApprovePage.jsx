import React, { useEffect, useState } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

const DeviceApprovePage = () => {
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '' });

  const fetchPendingDevices = async () => {
    try {
      // 1. CSRF 토큰 발급소에서 응답(Response)을 통째로 받아옵니다.
      const csrfRes = await axios.get('http://localhost:8080/api/auth/csrf', {
        withCredentials: true
      });

      // 🚀 마법의 코드: 응답 데이터에서 토큰을 직접 뽑아내서 Axios 전역 헤더에 박아버립니다!
      // (파트너가 스프링 기본 설정을 썼다면 토큰은 csrfRes.data.token 에 들어있습니다)
      if (csrfRes.data && csrfRes.data.token) {
        axios.defaults.headers.common['X-XSRF-TOKEN'] = csrfRes.data.token;
      } else if (typeof csrfRes.data === 'string') {
        // 혹시 파트너가 토큰 문자열만 덜렁 보냈을 경우를 대비한 보험
        axios.defaults.headers.common['X-XSRF-TOKEN'] = csrfRes.data;
      }

      // 2. 이제 이마에 토큰을 붙였으니 당당하게 기기 목록을 불러옵니다.
      const res = await axios.get('http://localhost:8080/devices/pending', {
        withCredentials: true
      });
      setDevices(res.data);
    } catch (error) {
      console.error("데이터 로드 실패", error);
    }
  };

  const handleRejectClick = async (device) => {
    // 1. 실수 방지용 확인 창 (UX 개선)
    if (!window.confirm(`정말 ${device.macId} 기기의 연결을 거절하시겠습니까?`)) {
      return; // 취소를 누르면 아무 일도 일어나지 않음
    }

    try {
      // 2. 백엔드로 거절(POST) 요청 보내기
      // 💡 이미 앞서 토큰을 전역 헤더에 달아두었으므로 시큐리티 프리패스입니다!
      await axios.post('http://localhost:8080/devices/reject', 
        {
          macId: device.macId
        },
        {
          withCredentials: true
        }
      );

      // 3. 처리 성공 시 알림 및 목록 새로고침
      alert("거절 처리되었습니다.");
      fetchPendingDevices(); // 목록에서 사라지도록 다시 불러오기
      
    } catch (error) {
      console.error("거절 처리 실패", error);
      alert("거절 처리에 실패했습니다.");
    }
  };

  useEffect(() => { fetchPendingDevices(); }, []);

  const handleApproveClick = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

const handleSubmit = async () => {
    if (!formData.name || !formData.location) return alert("필수 항목을 입력해주세요.");
    
    await axios.post('http://localhost:8080/devices/approve', 
      {
        macId: selectedDevice.macId,
        ...formData
      }, 
      {
        withCredentials: true 
      }
    );
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
                    onClick={() => handleRejectClick(device)}
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