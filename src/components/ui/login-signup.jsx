"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Component as SilkBackground } from "./silk-background-animation";

export default function LoginCardSection({
  username,
  password,
  message,
  loading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSignup,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50">
      <style>{`
        .card-animate {opacity: 0;transform: translateY(20px);animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards;}
        @keyframes fadeUp {to {opacity: 1;transform: translateY(0);}}
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <SilkBackground showContent={false} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
        <span className="text-xs tracking-[0.14em] uppercase text-zinc-400">IOT PROJECT</span>
      </header>

      <div className="relative z-20 h-full w-full grid place-items-center px-4">
        <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">IoT Dashboard 관리자</CardTitle>
            <CardDescription className="text-zinc-400">관리자 계정으로 로그인</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-zinc-300">
                  아이디
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-zinc-300">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && <p className="text-sm text-rose-400 text-center">{message}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
              >
                {loading ? "처리 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex items-center justify-center text-sm text-zinc-400">
            <button type="button" className="text-zinc-200 hover:underline" onClick={onSignup}>
              회원가입
            </button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
