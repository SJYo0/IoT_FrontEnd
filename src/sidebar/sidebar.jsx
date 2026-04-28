import React, { useState } from 'react';
// 💡 Cctv 아이콘 추가
import { LayoutDashboard, TabletSmartphone, Settings, Cctv, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, readApiMessage } from '../Auth/api';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const hidePaths = ['/', '/signup'];
  if (hidePaths.includes(location.pathname)) return null;

  const ICON_SIZE = 28;

  const menuItems = [
    { icon: <LayoutDashboard size={ICON_SIZE} />, path: '/dashboard', label: '대시보드' },
    { icon: <TabletSmartphone size={ICON_SIZE} />, path: '/device/approveReq', label: '연결 요청' },
    // 💡 CCTV 메뉴 아이템 추가
    { icon: <Cctv size={ICON_SIZE} />, path: '/cctv', label: '실시간 관제' },
    { icon: <Settings size={ICON_SIZE} />, path: '/settings', label: '설정' },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await apiFetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        alert(await readApiMessage(response, '로그아웃에 실패했습니다.'));
        return;
      }

      navigate('/', { replace: true });
    } catch {
      alert('로그아웃에 실패했습니다.');
    } finally {
      setLoggingOut(false);
    }
  };
  
  return (
    <aside className="flex h-screen w-20 flex-col items-center gap-6 border-r border-slate-200 bg-white py-5">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`rounded-xl p-3 transition-colors ${
            location.pathname === item.path 
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mb-2 mt-auto flex flex-col items-center gap-1 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        title="로그아웃"
      >
        <LogOut size={24} />
        <span className="text-[10px] font-semibold">
          {loggingOut ? '처리중' : '로그아웃'}
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;