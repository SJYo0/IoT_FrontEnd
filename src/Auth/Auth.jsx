import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ensureCsrfToken, readApiMessage } from "./api";

function Auth() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    ensureCsrfToken().catch(() => {
      if (active) {
        setMessage("보안 토큰을 불러오지 못했습니다.");
      }
    });

    apiFetch("/api/auth/me")
      .then((response) => {
        if (active && response.ok) {
          navigate("/weather", { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setMessage("");
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  // 로그인
  const login = async () => {
    if (!id.trim() || !pw.trim()) {
      setMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: id, password: pw }),
      });

      if (!res.ok) {
        setMessage(await readApiMessage(res, "로그인에 실패했습니다."));
        return;
      }

      setMessage(await readApiMessage(res, "로그인 성공"));
      navigate("/weather", { replace: true });
    } catch {
      setMessage("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 w-full">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          IoT Dashboard 관리자
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">아이디</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input
              value={pw}
              type="password"
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {message && (
            <p className="text-red-500 text-sm font-bold text-center mt-2 animate-pulse">
              {message}
            </p>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={login} 
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:bg-gray-400"
            >
              {loading ? "처리 중..." : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              disabled={loading}
              className="w-full py-3 bg-white text-gray-700 font-bold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;