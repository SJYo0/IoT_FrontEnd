import { useEffect } from "react";

export default function HeroSection({ children, showContent = false }) {
  useEffect(() => {
    document.querySelectorAll(".animation-line").forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}px`;
      path.style.strokeDashoffset = `${len}px`;

      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 2s ease-in-out";
        path.style.strokeDashoffset = "0px";
      }, 500);
    });
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes patternScroll {
            0% { transform: translate(-5%, -5%); }
            100% { transform: translate(5%, 5%); }
          }

          .animate-fadeIn {
            animation: fadeIn 1s ease-out forwards;
          }

          .animate-patternScroll {
            animation: patternScroll 20s linear infinite;
          }

          .gradient-text {
            background: linear-gradient(270deg, #ff00cc, #3333ff, #00ffcc, #ff00cc);
            background-size: 600% 600%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient 15s ease infinite;
          }

          .animation-line {
            fill: none;
            stroke: white;
            stroke-width: 2;
          }

          @keyframes pulse {
            0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
            50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
            100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
          }

          .pulse-animation {
            animation: pulse 2s infinite;
          }
        `}
      </style>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black font-sans text-white">
        <div className="line-group absolute left-0 top-0 z-0 h-full w-full overflow-hidden">
          <svg className="line-wrapper absolute h-full w-full" viewBox="0 0 177 159" preserveAspectRatio="none">
            <path
              id="main-line"
              className="animation-line"
              d="M176 1L53.5359 1C52.4313 1 51.5359 1.89543 51.5359 3L51.5359 56C51.5359 57.1046 50.6405 58 49.5359 58L0 58"
            />
          </svg>

          <svg className="line-wrapper absolute h-full w-full" viewBox="0 0 176 59" preserveAspectRatio="none">
            <path
              className="animation-line"
              d="M0 1L122.464 1C123.569 1 124.464 1.89543 124.464 3L124.464 56C124.464 57.1046 125.36 58 126.464 58L176 58"
            />
          </svg>
        </div>

        <div
          className="pattern animate-patternScroll absolute h-[200%] w-[200%] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"
          style={{ top: "-50%", left: "-50%" }}
        />
        <div
          className="pattern animate-patternScroll absolute h-[200%] w-[200%] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"
          style={{ top: "50%", left: "50%" }}
        />

        {showContent && (
          <div className="container relative z-10 animate-fadeIn p-10 text-center">
            <h1 className="relative z-20 m-0 text-6xl leading-tight">
              Ready to build
              <br />
              <span className="gradient-text relative z-10 inline-block">the software of the future?</span>
            </h1>
            <button
              type="button"
              className="pulse-animation mt-10 cursor-pointer rounded border-none bg-white px-10 py-4 text-xl text-black shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              Start building
            </button>
          </div>
        )}

        {children && <div className="relative z-20 w-full">{children}</div>}
      </div>
    </>
  );
}
