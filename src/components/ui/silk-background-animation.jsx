"use client";

export function SilkBackground({ children, showContent = false }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f4f2f7]">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="select-none font-black tracking-[-0.06em] text-zinc-300/70"
          style={{
            fontSize: "clamp(8rem, 28vw, 18rem)",
            transform: "rotate(-12deg)",
            lineHeight: 1,
          }}
        >
          AISS
        </span>
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/30 via-transparent to-zinc-200/25" />

      {showContent && (
        <div className="relative z-20 flex h-full items-center justify-center px-8 text-center">
          <h1 className="text-6xl font-light tracking-[-0.05em] text-zinc-400 sm:text-8xl md:text-9xl">
            AISS
          </h1>
        </div>
      )}

      {children && <div className="relative z-20 h-full w-full">{children}</div>}
    </div>
  );
}

export const Component = SilkBackground;

export default SilkBackground;
