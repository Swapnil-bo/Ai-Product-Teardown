import { useEffect, useState } from "react";

const ANALYSIS_STEPS = [
  "Scraping product surface...",
  "Mapping target personas...",
  "Diagnosing pain points...",
  "Modeling monetization structure...",
  "Stress-testing the moat...",
  "Identifying missing features...",
  "Flagging red flags...",
  "Writing PM verdict...",
  "Finalizing teardown...",
];

export default function Loader({ isVisible = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");

  // Cycle through analysis steps + reset on hide (collapsed into one effect)
  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setDots("");
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2200);

    return () => clearInterval(stepInterval);
  }, [isVisible]);

  // Fake progress bar — never hits 100 until done
  // Uses fixed-precision math to prevent floating point drift in % display
  useEffect(() => {
    if (!isVisible) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev; // stall near the end — feels real
        const increment = prev < 40 ? 3 : prev < 70 ? 1.5 : 0.5;
        return Math.min(Math.round((prev + increment) * 10) / 10, 92);
      });
    }, 180);

    return () => clearInterval(progressInterval);
  }, [isVisible]);

  // Animated ellipsis
  useEffect(() => {
    if (!isVisible) return;

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="loader-overlay animate-fade-in" role="dialog" aria-modal="true" aria-label="Analyzing product">
      {/* Ambient glow */}
      <div className="loader-glow" aria-hidden="true" />

      <div className="loader-card animate-scale-in">

        {/* Header */}
        <div className="loader-header">
          <div className="loader-icon" aria-hidden="true">
            <div className="loader-icon__ring" />
            <div className="loader-icon__ring loader-icon__ring--2" />
            <span className="loader-icon__symbol">⬡</span>
          </div>
          <div>
            <p className="loader-title">Analyzing Product</p>
            <p className="loader-subtitle">
              LLaMA 3.3 70B · Groq Inference
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="loader-progress-track"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Analysis progress"
        >
          <div
            className="loader-progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div
            className="loader-progress-glow"
            style={{ left: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Step indicator — aria-live so screen readers announce step changes */}
        <div
          className="loader-step"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="loader-step__icon" aria-hidden="true">›</span>
          <span className="loader-step__text">
            {ANALYSIS_STEPS[currentStep]}
            <span className="loader-step__dots" aria-hidden="true">{dots}</span>
          </span>
          <span className="loader-step__pct" aria-hidden="true">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Dot grid — the signature visual */}
        <div className="loader-dot-grid" aria-hidden="true">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="loader-dot"
              style={{
                animationDelay: `${(i * 137.5) % 1400}ms`, // golden angle distribution
              }}
            />
          ))}
        </div>

        {/* Step pills */}
        <div className="loader-steps-track" aria-hidden="true">
          {ANALYSIS_STEPS.map((_, i) => (
            <div
              key={i}
              className={`loader-step-pill ${
                i < currentStep
                  ? "loader-step-pill--done"
                  : i === currentStep
                  ? "loader-step-pill--active"
                  : "loader-step-pill--pending"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <p className="loader-footer">
          Board-room grade analysis takes ~10–20 seconds
        </p>
      </div>

      <style>{`
        .loader-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: var(--space-4);
        }

        .loader-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(232, 80, 10, 0.08) 0%,
            transparent 70%
          );
          pointer-events: none;
          animation: loader-glow-pulse 3s ease-in-out infinite;
        }

        @keyframes loader-glow-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%       { transform: scale(1.1); opacity: 1;   }
        }

        .loader-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-xl);
          padding: var(--space-7) var(--space-8);
          width: 100%;
          max-width: 480px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-lg), 0 0 80px rgba(232, 80, 10, 0.08);
        }

        /* Top accent line */
        .loader-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--accent) 40%,
            var(--accent) 60%,
            transparent 100%
          );
        }

        /* Corner bracket — war room aesthetic */
        .loader-card::after {
          content: '';
          position: absolute;
          bottom: 0; right: 0;
          width: 40px;
          height: 40px;
          border-bottom: 1px solid var(--border-accent);
          border-right: 1px solid var(--border-accent);
          border-radius: 0 0 var(--radius-xl) 0;
          pointer-events: none;
        }

        /* ---- Header ---- */
        .loader-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .loader-icon {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .loader-icon__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: var(--accent);
          border-right-color: rgba(232, 80, 10, 0.3);
          animation: ring-spin 1.2s linear infinite;
        }

        .loader-icon__ring--2 {
          inset: 6px;
          border-top-color: transparent;
          border-bottom-color: var(--accent);
          animation-direction: reverse;
          animation-duration: 1.8s;
          opacity: 0.5;
        }

        @keyframes ring-spin {
          to { transform: rotate(360deg); }
        }

        .loader-icon__symbol {
          font-size: 1rem;
          color: var(--accent);
          position: relative;
          z-index: 1;
          animation: symbol-pulse 2s ease-in-out infinite;
        }

        @keyframes symbol-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; text-shadow: 0 0 12px var(--accent); }
        }

        .loader-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          max-width: none;
          line-height: 1.3;
        }

        .loader-subtitle {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          max-width: none;
          line-height: 1.4;
          margin-top: 2px;
        }

        /* ---- Progress bar ---- */
        .loader-progress-track {
          height: 3px;
          background: var(--bg-overlay);
          border-radius: 99px;
          overflow: visible;
          position: relative;
          margin-bottom: var(--space-4);
        }

        .loader-progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--accent-dim),
            var(--accent)
          );
          border-radius: 99px;
          transition: width 0.18s ease-out;
          position: relative;
        }

        .loader-progress-glow {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent-glow);
          transition: left 0.18s ease-out;
          pointer-events: none;
        }

        /* ---- Step text ---- */
        .loader-step {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          min-height: 22px;
        }

        .loader-step__icon {
          font-family: var(--font-mono);
          color: var(--accent);
          font-size: 1rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .loader-step__text {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--text-secondary);
          letter-spacing: 0.03em;
          flex: 1;
        }

        .loader-step__dots {
          display: inline-block;
          width: 1.5ch;
          color: var(--accent);
        }

        .loader-step__pct {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--accent);
          font-weight: 500;
          flex-shrink: 0;
        }

        /* ---- Dot grid ---- */
        .loader-dot-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: var(--space-5);
        }

        .loader-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          animation: dot-breathe 1.4s ease-in-out infinite both;
          justify-self: center;
        }

        @keyframes dot-breathe {
          0%, 100% {
            opacity: 0.1;
            transform: scale(0.6);
            background: var(--bg-overlay);
          }
          50% {
            opacity: 1;
            transform: scale(1);
            background: var(--accent);
            box-shadow: 0 0 6px var(--accent-glow);
          }
        }

        /* ---- Step pills ---- */
        .loader-steps-track {
          display: flex;
          gap: 4px;
          margin-bottom: var(--space-5);
        }

        .loader-step-pill {
          flex: 1;
          height: 3px;
          border-radius: 99px;
          transition: background var(--transition-normal);
        }

        .loader-step-pill--done {
          background: var(--accent-dim);
        }

        .loader-step-pill--active {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent-glow);
          animation: pill-pulse 1s ease-in-out infinite;
        }

        .loader-step-pill--pending {
          background: var(--bg-overlay);
        }

        @keyframes pill-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        /* ---- Footer ---- */
        .loader-footer {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--text-muted);
          text-align: center;
          letter-spacing: 0.04em;
          max-width: none;
        }

        /* ---- Responsive ---- */
        @media (max-width: 480px) {
          .loader-card {
            padding: var(--space-6) var(--space-5);
          }
        }
      `}</style>
    </div>
  );
}