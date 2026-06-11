"use client";

import { motion } from "framer-motion";
import { AUTH_LABELS as L } from "../../constants/authLabels";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

export default function GamifiedForgotPasswordCard({
  step,
  username,
  email,
  code,
  newPassword,
  confirmPassword,
  issuedCode,
  message,
  loading,
  onUsernameChange,
  onEmailChange,
  onCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onRequestCode,
  onResetPassword,
  onBackToLogin,
}) {
  const isRequestStep = step === "request";

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative z-20 flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black">IoT Dashboard {L.dashboardTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isRequestStep ? L.forgotTitle : L.resetTitle}
          </p>
        </div>

        {isRequestStep ? (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div>
              <Label htmlFor="forgot-username" className="text-black">
                {L.username}
              </Label>
              <Input
                id="forgot-username"
                type="text"
                placeholder={L.usernamePlaceholder}
                value={username}
                onChange={(e) => onUsernameChange?.(e.target.value)}
                className="mt-1 border-zinc-300 bg-white text-black"
              />
            </motion.div>
            <motion.div>
              <Label htmlFor="forgot-email" className="text-black">
                {L.email}
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder={L.emailPlaceholder}
                value={email}
                onChange={(e) => onEmailChange?.(e.target.value)}
                className="mt-1 border-zinc-300 bg-white text-black"
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {L.username}: <span className="font-semibold text-black">{username}</span>
            </motion.div>
            {issuedCode && (
              <motion.div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                <p className="text-xs text-amber-800">{L.issuedCode}</p>
                <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-amber-900">{issuedCode}</p>
              </motion.div>
            )}
            <motion.div>
              <Label htmlFor="forgot-code" className="text-black">
                {L.resetCode}
              </Label>
              <Input
                id="forgot-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => onCodeChange?.(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 border-zinc-300 bg-white text-black"
              />
            </motion.div>
            <motion.div>
              <Label htmlFor="forgot-new-password" className="text-black">
                {L.newPassword}
              </Label>
              <Input
                id="forgot-new-password"
                type="password"
                placeholder={L.newPasswordPlaceholder}
                value={newPassword}
                onChange={(e) => onNewPasswordChange?.(e.target.value)}
                className="mt-1 border-zinc-300 bg-white text-black"
              />
            </motion.div>
            <motion.div>
              <Label htmlFor="forgot-confirm-password" className="text-black">
                {L.confirmPassword}
              </Label>
              <Input
                id="forgot-confirm-password"
                type="password"
                placeholder={L.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
                className="mt-1 border-zinc-300 bg-white text-black"
              />
            </motion.div>
          </motion.div>
        )}

        {message && (
          <p
            className={`text-center text-sm ${
              message.includes("\uBCC0\uACBD") ||
              message.includes("\uBC1C\uAE09") ||
              message.includes("\uBC1C\uC1A1")
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {message}
          </p>
        )}

        {isRequestStep ? (
          <Button
            className="h-11 w-full bg-black text-white hover:bg-zinc-800"
            onClick={onRequestCode}
            disabled={loading}
          >
            {loading ? L.loading : L.requestCode}
          </Button>
        ) : (
          <Button
            className="h-11 w-full bg-black text-white hover:bg-zinc-800"
            onClick={onResetPassword}
            disabled={loading}
          >
            {loading ? L.loading : L.changePassword}
          </Button>
        )}

        <p className="text-center text-sm text-zinc-600">
          <button type="button" onClick={onBackToLogin} className="text-black hover:underline">
            {L.backToLogin}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
