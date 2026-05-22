"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AUTH_LABELS as L } from "../../constants/authLabels";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const colors = ["#facc15", "#22c55e", "#3b82f6", "#f472b6", "#f97316"];

export default function GamifiedLoginCard({
  username,
  password,
  message,
  loading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSignup,
  onForgotPassword,
}) {
  const [success, setSuccess] = React.useState(false);
  const [particles, setParticles] = React.useState([]);

  React.useEffect(() => {
    if (typeof message === "string" && message.includes(L.loginSuccessKeyword)) {
      setSuccess(true);
    }
  }, [message]);

  const handleLogin = () => {
    if (!username || !password || loading) return;

    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: Date.now() + i,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setSuccess(true);

    onSubmit?.();
    setTimeout(() => setParticles([]), 1000);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute z-10 h-3 w-3 rounded-full"
            style={{ backgroundColor: p.color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: p.rotate }}
            animate={{
              x: (Math.random() - 0.5) * 150,
              y: -Math.random() * 200,
              scale: 0,
              opacity: 0,
              rotate: p.rotate + Math.random() * 360,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-20 flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black">IoT Dashboard {L.dashboardTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">{L.loginSubtitle}</p>
        </div>

        <div className="mt-2 flex flex-col gap-4">
          <motion.div>
            <Label htmlFor="email" className="text-black">
              {L.username}
            </Label>
            <Input
              id="email"
              type="text"
              placeholder={L.usernamePlaceholder}
              value={username}
              onChange={(e) => onUsernameChange?.(e.target.value)}
              className="mt-1 border-zinc-300 bg-white text-black transition-transform duration-200 hover:scale-[1.02]"
            />
          </motion.div>
          <motion.div>
            <Label htmlFor="password" className="text-black">
              {L.password}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => onPasswordChange?.(e.target.value)}
              className="mt-1 border-zinc-300 bg-white text-black transition-transform duration-200 hover:scale-[1.02]"
            />
          </motion.div>
        </div>

        {message && <p className="text-center text-sm text-rose-600">{message}</p>}

        <Button
          className="mt-2 h-11 w-full bg-black text-white transition-transform duration-200 hover:scale-[1.04] hover:bg-zinc-800"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? L.loading : L.login}
        </Button>

        {!success && (
          <motion.div className="mt-1 space-y-1 text-center text-sm text-zinc-600">
            <p>
              {L.noAccount}{" "}
              <button type="button" onClick={onSignup} className="text-black hover:underline">
                {L.signup}
              </button>
            </p>
            <p>
              <button type="button" onClick={onForgotPassword} className="text-black hover:underline">
                {L.forgotPassword}
              </button>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
