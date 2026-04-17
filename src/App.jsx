import React, { useState, useEffect } from 'react';
import {BrowserRouter, Navigate, Routes, Route} from 'react-router-dom';

import Sidebar from './sidebar/sidebar';
import DeviceApprovePage from './registerDevice/DeviceApprovePage';

import Auth from './Auth/Auth';
import Signup from './Auth/Signup';
import Weather from './DashBoard/Weather';
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
    <BrowserRouter>
      
      {/* 전체화면 컨테이너 */}
      <div className="flex w-full h-screen overflow-hidden bg-[#262a2b]">
        
        {/* 좌측 고정 사이드 바 */}
        <Sidebar />

        {/* 우측 메인 영역 */}
        <div className="flex-1 overflow-y-auto">

          {/* URL에 따라 화면 바꾸기 */}
          <Routes>

            <Route path="/device/approveReq" element={<DeviceApprovePage />} />

            <Route path="/" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/weather"
              element={
                <ProtectedRoute>
                  <Weather />
                </ProtectedRoute>
              }
            />

          </Routes>

        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;