const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "../src/components/ui/gamified-login-card.jsx");

const ko = {
  success: "\uC131\uACF5",
  title: "\uAD00\uB9AC\uC790",
  subtitle: "\uAD00\uB9AC\uC790 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778",
  username: "\uC544\uC774\uB514",
  usernamePh: "\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694",
  password: "\uBE44\uBC00\uBC88\uD638",
  loading: "\uCC98\uB9AC \uC911...",
  login: "\uB85C\uADF8\uC778",
  forgot: "\uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30",
  noAccount: "\uACC4\uC815\uC774 \uC5C6\uC73C\uC2E0\uAC00\uC694?",
  signup: "\uD68C\uC6D0\uAC00\uC785",
};

const content = `"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    if (typeof message === "string" && message.includes("${ko.success}")) {
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
          <h2 className="text-3xl font-bold text-black">IoT Dashboard ${ko.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">${ko.subtitle}</p>
        </div>

        <div className="mt-2 flex flex-col gap-4">
          <div>
            <Label htmlFor="email" className="text-black">
              ${ko.username}
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="${ko.usernamePh}"
              value={username}
              onChange={(e) => onUsernameChange?.(e.target.value)}
              className="mt-1 border-zinc-300 bg-white text-black transition-transform duration-200 hover:scale-[1.02]"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-black">
              ${ko.password}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => onPasswordChange?.(e.target.value)}
              className="mt-1 border-zinc-300 bg-white text-black transition-transform duration-200 hover:scale-[1.02]"
            />
          </div>
        </div>

        {message && <p className="text-center text-sm text-rose-600">{message}</p>}

        <Button
          className="mt-2 h-11 w-full bg-black text-white transition-transform duration-200 hover:scale-[1.04] hover:bg-zinc-800"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "${ko.loading}" : "${ko.login}"}
        </Button>

        {!success && (
          <div className="mt-1 space-y-1 text-center text-sm text-zinc-600">
            <p>
              <button type="button" onClick={onForgotPassword} className="text-black hover:underline">
                ${ko.forgot}
              </button>
            </p>
            <p>
              ${ko.noAccount}{" "}
              <button type="button" onClick={onSignup} className="text-black hover:underline">
                ${ko.signup}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
`;

fs.writeFileSync(target, content, "utf8");
console.log("Fixed:", target);
