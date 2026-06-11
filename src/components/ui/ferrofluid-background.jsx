export default function FerrofluidBackground({ children, showContent = false }) {
  return (
    <main className="ferrofluid-hero relative flex h-screen w-full items-center justify-center overflow-hidden">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="ferrofluid" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -15"
            result="contrast"
          />
          <feComposite in="SourceGraphic" in2="contrast" operator="atop" />
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.08" numOctaves="3" result="noise" />
          <feDisplacementMap in="contrast" in2="noise" scale="50" />
        </filter>
      </svg>

      <div className="ferrofluid-canvas pointer-events-none absolute inset-0">
        <div className="globule globule-1" />
        <div className="globule globule-2" />
        <div className="globule globule-3" />
      </div>

      {showContent && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
          <h1
            className="mb-4 text-5xl font-black tracking-tight text-white md:text-7xl"
            style={{ textShadow: "0 0 15px rgba(0,0,0,0.5)" }}
          >
            Forging the Future
          </h1>
          <p
            className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 md:text-xl"
            style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}
          >
            Experience a new wave of digital artistry with dynamic, fluid animations that redefine interaction.
          </p>
          <a
            href="#"
            className="transform rounded-full bg-white px-8 py-3 text-lg font-bold text-black shadow-lg shadow-white/20 transition-all duration-300 hover:scale-105 hover:bg-gray-200"
          >
            Discover Now
          </a>
        </div>
      )}

      {children && <div className="relative z-20 w-full">{children}</div>}

      <style>{`
        .ferrofluid-hero {
          background: #000;
        }

        .ferrofluid-canvas {
          filter: url(#ferrofluid);
        }

        .globule {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ffffff 0%, #d4d4d4 45%, #737373 100%);
          will-change: transform;
        }

        .globule-1 {
          width: 220px;
          height: 220px;
          left: 18%;
          top: 28%;
          animation: ferrofluid-move-1 9s ease-in-out infinite alternate;
        }

        .globule-2 {
          width: 170px;
          height: 170px;
          right: 22%;
          top: 18%;
          animation: ferrofluid-move-2 11s ease-in-out infinite alternate;
        }

        .globule-3 {
          width: 200px;
          height: 200px;
          left: 42%;
          bottom: 16%;
          animation: ferrofluid-move-3 13s ease-in-out infinite alternate;
        }

        @keyframes ferrofluid-move-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(120px, 80px) scale(1.15); }
        }

        @keyframes ferrofluid-move-2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-100px, 110px) scale(0.9); }
        }

        @keyframes ferrofluid-move-3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-80px, -90px) scale(1.1); }
        }
      `}</style>
    </main>
  );
}
