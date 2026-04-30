import React, { useState, useEffect } from 'react';
import {Navigate, Routes, Route} from 'react-router-dom';

import Sidebar from './sidebar/sidebar';
import TopSidebar from "./sidebar/TopSidebar";
import DeviceApprovePage from './registerDevice/DeviceApprovePage';
import DeviceConnectionInfoPage from "./registerDevice/DeviceConnectionInfoPage";

import Auth from './Auth/Auth';
import Signup from './Auth/Signup';
import Weather from './DashBoard/Weather';
import CctvPage from './CCTV/CctvPage';
import SettingsPage from "./settings/SettingsPage";
import { apiFetch } from "./Auth/api";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    apiFetch("/api/auth/me")
      .then((response) => {
        if (!active) {
          return;
        }

        setStatus(response.ok ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (active) {
          setStatus("unauthenticated");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <p>로그인 상태를 확인하는 중...</p>;
  }

  return status === "authenticated" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <>
      
      {/* 전체화면 컨테이너 */}
      <div className="flex w-full h-screen overflow-hidden bg-slate-100">
        
        {/* 좌측 고정 사이드 바 */}
        <Sidebar />

        {/* 우측 메인 영역 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopSidebar />
          <div className="flex-1 overflow-y-auto">
            {/* URL에 따라 화면 바꾸기 */}
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Weather />
                  </ProtectedRoute>
                }
              />
              <Route path="/weather" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/device/approveReq"
                element={
                  <ProtectedRoute>
                    <DeviceApprovePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/device/connections"
                element={
                  <ProtectedRoute>
                    <DeviceConnectionInfoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cctv"
                element={
                  <ProtectedRoute>
                    <CctvPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>

      </div>
    </>
  );
}

export default App;