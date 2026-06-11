import React from "react";

const CardCanvas = ({ children, className = "" }) => {
  return (
    <div className={`card-canvas ${className}`}>
      <style>{`
        .card-canvas {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 22px;
        }

        .card-backdrop {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(80% 80% at 20% 10%, rgba(56, 189, 248, 0.14), transparent 45%),
            radial-gradient(70% 70% at 80% 90%, rgba(139, 92, 246, 0.12), transparent 45%),
            linear-gradient(180deg, #090b12 0%, #0e111d 100%);
          filter: saturate(115%);
        }

        .glow-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.28);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.35);
        }

        .card-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
        }

        .border-element {
          position: absolute;
          z-index: 1;
          opacity: 0.85;
          pointer-events: none;
        }

        .border-top,
        .border-bottom {
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 40%, rgba(168, 85, 247, 0.8) 60%, transparent 100%);
          animation: glowX 3s linear infinite;
        }

        .border-top { top: 0; }
        .border-bottom { bottom: 0; animation-direction: reverse; }

        .border-left,
        .border-right {
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.75) 40%, rgba(168, 85, 247, 0.75) 60%, transparent 100%);
          animation: glowY 3.4s linear infinite;
        }

        .border-left { left: 0; }
        .border-right { right: 0; animation-direction: reverse; }

        @keyframes glowX {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(20%); }
        }

        @keyframes glowY {
          0% { transform: translateY(-20%); }
          100% { transform: translateY(20%); }
        }
      `}</style>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter width="3000%" x="-1000%" height="3000%" y="-1000%" id="unopaq">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 3 0" />
        </filter>
      </svg>
      <div className="card-backdrop" />
      {children}
    </div>
  );
};

const Card = ({ children, className = "" }) => {
  return (
    <div className={`glow-card ${className}`}>
      <div className="border-element border-left" />
      <div className="border-element border-right" />
      <div className="border-element border-top" />
      <div className="border-element border-bottom" />
      <div className="card-content">{children}</div>
    </div>
  );
};

export { CardCanvas, Card };
