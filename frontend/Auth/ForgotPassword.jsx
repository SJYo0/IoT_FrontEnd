import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ensureCsrfToken, readApiMessage } from "./api";
import GamifiedForgotPasswordCard from "../components/ui/gamified-forgot-password-card";

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,12}$/;

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [issuedCode, setIssuedCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureCsrfToken().catch(() => {
      setMessage("보안 토큰을 불러오지 못했습니다.");
    });
  }, []);

  const requestCode = async () => {
    if (!username.trim() || !email.trim()) {
      setMessage("아이디와 가입 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await apiFetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        setMessage(await readApiMessage(res, "인증 코드 발급에 실패했습니다."));
        return;
      }

      const data = await res.json();
      setMessage(data?.message || "인증 코드가 발급되었습니다.");
      setIssuedCode(data?.emailSent ? "" : String(data?.resetCode || ""));
      setStep("reset");
    } catch {
      setMessage("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setMessage("6자리 인증 코드를 입력해주세요.");
      return;
    }
    if (!PASSWORD_POLICY.test(newPassword)) {
      setMessage(
        "비밀번호는 8~12자이며 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await apiFetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      if (!res.ok) {
        setMessage(await readApiMessage(res, "비밀번호 변경에 실패했습니다."));
        return;
      }

      setMessage(await readApiMessage(res, "비밀번호가 변경되었습니다."));
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch {
      setMessage("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
      <GamifiedForgotPasswordCard
        step={step}
        username={username}
        email={email}
        code={code}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        issuedCode={issuedCode}
        message={message}
        loading={loading}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onCodeChange={setCode}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onRequestCode={requestCode}
        onResetPassword={resetPassword}
        onBackToLogin={() => navigate("/")}
      />
    </div>
  );
}

export default ForgotPassword;
