import React, { useEffect, useState } from 'react';
// 💡 Cctv 아이콘 추가
import { LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, readApiMessage } from '../Auth/api';
import { NAV_ITEMS } from "../navigation/navItems";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deviceContextMenu, setDeviceContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
  });

  const hidePaths = ['/', '/signup'];
  if (hidePaths.includes(location.pathname)) return null;

  const ICON_SIZE = 28;
  const DEVICE_PATH = "/device/approveReq";

  useEffect(() => {
    if (!deviceContextMenu.open) {
      return undefined;
    }

    const closeMenu = () => {
      setDeviceContextMenu((prev) => ({ ...prev, open: false }));
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [deviceContextMenu.open]);

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

  const openDeviceContextMenu = (event) => {
    event.preventDefault();
    setDeviceContextMenu({
      open: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const moveToConnectionInfo = () => {
    setDeviceContextMenu((prev) => ({ ...prev, open: false }));
    navigate("/device/connections");
  };
  
  return (
    <aside className="flex h-screen w-20 flex-col items-center gap-6 border-r border-slate-200 bg-white py-5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
        <Link
          key={item.path}
          to={item.path}
          onContextMenu={item.path === DEVICE_PATH ? openDeviceContextMenu : undefined}
          className={`rounded-xl p-3 transition-colors ${
            location.pathname === item.path 
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title={item.label}
        >
          <Icon size={ICON_SIZE} />
        </Link>
        );
      })}
      {deviceContextMenu.open && (
        <div
          className="fixed z-[1000] min-w-[128px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          style={{ left: deviceContextMenu.x, top: deviceContextMenu.y }}
        >
          <button
            type="button"
            onClick={moveToConnectionInfo}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            연결정보
          </button>
        </div>
      )}
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