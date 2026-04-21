import React from 'react';
// 💡 Cctv 아이콘 추가
import { LayoutDashboard, TabletSmartphone, Settings, Cctv } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const hidePaths = ['/', '/signup'];
  if (hidePaths.includes(location.pathname)) return null;

  const ICON_SIZE = 52;

  const menuItems = [
    { icon: <LayoutDashboard size={ICON_SIZE} />, path: '/', label: '대시보드' },
    { icon: <TabletSmartphone size={ICON_SIZE} />, path: '/device/approveReq', label: '연결 요청' },
    // 💡 CCTV 메뉴 아이템 추가
    { icon: <Cctv size={ICON_SIZE} />, path: '/cctv', label: '실시간 관제' },
    { icon: <Settings size={ICON_SIZE} />, path: '/settings', label: '설정' },
  ];

  return (
    // 배경을 흰색으로, 우측에 연한 테두리 추가
    <div className="w-32 h-screen bg-white border-r border-gray-200 flex flex-col items-center py-8 gap-8">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`p-4 rounded-xl transition-colors ${
            // 현재 페이지면 옅은 회색 배경, 아니면 마우스 올릴 때만 옅은 회색
            location.pathname === item.path 
              ? 'bg-gray-200 text-black' 
              : 'text-black hover:bg-gray-100'
          }`}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;