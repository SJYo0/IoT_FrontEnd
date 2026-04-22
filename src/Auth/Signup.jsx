import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ensureCsrfToken, readApiMessage } from "./api";

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,12}$/;

function Signup() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    ensureCsrfToken().catch(() => {
      setMessage("보안 토큰을 불러오지 못했습니다.");
    });
  }, []);

  const signup = async () => {
    if (!id.trim() || !pw.trim() || !email.trim()) {
      setMessage("아이디, 비밀번호, 이메일을 입력해주세요.");
      return;
    }

    if (!PASSWORD_POLICY.test(pw)) {
      setMessage(
        "비밀번호는 8~12자이며 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: id, password: pw, email }),
      });

      if (!res.ok) {
        setMessage(await readApiMessage(res, "회원가입에 실패했습니다."));
        return;
      }

      setMessage(await readApiMessage(res, "회원가입 성공"));
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
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
          관리자 회원가입
        </h2>
        
        <div className="space-y-5">
          {/* 아이디 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">아이디</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="사용할 아이디를 입력하세요"
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            />
          </div>
          
          {/* 비밀번호 입력 & 정책 안내 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input
              value={pw}
              type="password"
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">
              * 8~12자, 대/소문자, 숫자, 특수문자 포함
            </p>
          </div>

          {/* 이메일 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* 에러/성공 메시지 출력 */}
          {message && (
            <p className={`text-sm font-bold text-center mt-2 animate-pulse ${message.includes('성공') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          {/* 버튼 영역 */}
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={signup} 
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:bg-gray-400"
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={loading}
              className="w-full py-3 bg-white text-gray-700 font-bold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;