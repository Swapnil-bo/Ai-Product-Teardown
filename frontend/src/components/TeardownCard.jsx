import { useEffect, useRef, useState } from "react";
import Section from "./Section";

// ─────────────────────────────────────────────
// Styles — defined first, before any component
// that references them (avoids const init footgun)
// ─────────────────────────────────────────────

const TEARDOWN_STYLES = `
  /* ── Wrapper ── */
  .teardown-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding-bottom: var(--space-9);
  }

  /* ── Hero ── */
  .teardown-hero {
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    padding: var(--space-7) var(--space-7);
    position: relative;
    overflow: hidden;
  }

  /* Top gradient line */
  .teardown-hero__accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 30%,
      var(--amber) 60%,
      transparent 100%
    );
  }

  /* Corner brackets */
  .teardown-hero__corner {
    position: absolute;
    width: 24px;
    height: 24px;
    pointer-events: none;
  }

  .teardown-hero__corner--tl {
    top: 12px; left: 12px;
    border-top: 1px solid var(--border-accent);
    border-left: 1px solid var(--border-accent);
    border-radius: var(--radius-sm) 0 0 0;
  }

  .teardown-hero__corner--br {
    bottom: 12px; right: 12px;
    border-bottom: 1px solid var(--border-accent);
    border-right: 1px solid var(--border-accent);
    border-radius: 0 0 var(--radius-sm) 0;
  }

  /* Subtle mesh background */
  .teardown-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        ellipse 60% 40% at 90% 20%,
        rgba(232, 80, 10, 0.05) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 40% 60% at 10% 80%,
        rgba(240, 165, 0, 0.03) 0%,
        transparent 70%
      );
    pointer-events: none;
  }

  .teardown-hero__inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
    position: relative;
  }

  .teardown-hero__identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  /* Eyebrow */
  .teardown-hero__eyebrow {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .teardown-hero__eyebrow-text {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Product name */
  .teardown-hero__name {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    line-height: 1.05;
  }

  /* One-liner */
  .teardown-hero__one-liner {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.65;
    max-width: 58ch;
    font-style: italic;
  }

  /* Verdict row */
  .teardown-hero__verdict-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .teardown-hero__rationale {
    font-size: 0.83rem;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 48ch;
    flex: 1;
  }

  /* Verdict pill */
  .verdict-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.4em 1em;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    flex-shrink: 0;
  }

  .verdict-pill__icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .verdict--scale {
    background: var(--green-dim);
    color: var(--green);
    border-color: rgba(34, 197, 94, 0.3);
    box-shadow: 0 0 16px rgba(34, 197, 94, 0.1);
  }

  .verdict--kill {
    background: var(--red-dim);
    color: var(--red);
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 0 16px rgba(239, 68, 68, 0.1);
  }

  .verdict--pivot {
    background: var(--yellow-dim);
    color: var(--yellow);
    border-color: rgba(234, 179, 8, 0.3);
  }

  .verdict--hold {
    background: var(--bg-overlay);
    color: var(--text-secondary);
    border-color: var(--border-strong);
  }

  /* Score */
  .teardown-hero__score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .teardown-hero__score-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    max-width: none;
  }

  /* Score ring */
  .score-ring-wrap {
    position: relative;
    width: 128px;
    height: 128px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .score-ring-svg {
    position: absolute;
    inset: 0;
  }

  .score-ring-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    line-height: 1;
    gap: 2px;
  }

  .score-ring-value {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    transition: color var(--transition-normal);
  }

  .score-ring-denom {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.06em;
  }

  /* Score rationale */
  .teardown-hero__score-rationale {
    padding: var(--space-4) var(--space-5);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    position: relative;
  }

  .teardown-hero__score-rationale-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin-top: var(--space-2);
    max-width: none;
  }

  /* Biggest bet */
  .teardown-hero__bet {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    background: linear-gradient(
      135deg,
      rgba(240, 165, 0, 0.07) 0%,
      var(--bg-elevated) 100%
    );
    border: 1px solid rgba(240, 165, 0, 0.2);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-5);
  }

  .teardown-hero__bet-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--amber);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .teardown-hero__bet-text {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.65;
    max-width: none;
    flex: 1;
  }

  /* ── Meta bar ── */
  .meta-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border);
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .meta-item__icon {
    color: var(--accent);
    font-size: 0.7rem;
  }

  .meta-item--warn {
    color: var(--yellow);
  }

  .meta-item--warn .meta-item__icon {
    color: var(--yellow);
  }

  /* ── Sections grid ── */
  .teardown-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* ── Footer ── */
  .teardown-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .teardown-footer__label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .teardown-footer__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .teardown-hero {
      padding: var(--space-5);
    }

    .teardown-hero__inner {
      flex-direction: column-reverse;
      align-items: center;
      text-align: center;
    }

    .teardown-hero__identity {
      align-items: center;
    }

    .teardown-hero__one-liner {
      max-width: 100%;
    }

    .teardown-hero__verdict-row {
      justify-content: center;
    }

    .teardown-hero__rationale {
      text-align: left;
      max-width: 100%;
    }

    .meta-bar {
      gap: var(--space-3);
    }

    .teardown-footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .teardown-footer__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
`;

// ─────────────────────────────────────────────
// Style injection — once per app lifetime
// ─────────────────────────────────────────────

let stylesInjected = false;

function useInjectStyles(css) {
  useEffect(() => {
    if (stylesInjected) return;
    const tag = document.createElement("style");
    tag.setAttribute("data-teardown-styles", "true");
    tag.textContent = css;
    document.head.appendChild(tag);
    stylesInjected = true;
  }, []);
}

// ─────────────────────────────────────────────
// Score ring — animated SVG circle
// ─────────────────────────────────────────────

function ScoreRing({ score }) {
  const radius = 54;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const target = Math.min(Math.max(Number(score) || 0, 0), 10);
    const fillRatio = target / 10;
    const targetOffset = circumference * (1 - fillRatio);

    let start = null;
    let cancelled = false;      // unmount guard — prevents setState on unmounted component
    const duration = 1200;

    function ease(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function frame(ts) {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);

      setAnimatedScore(parseFloat((eased * target).toFixed(1)));
      setOffset(circumference - eased * (circumference - targetOffset));

      if (progress < 1) requestAnimationFrame(frame);
    }

    const raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [score, circumference]);

  // Color shifts as the score counts up — not just at the final value
  const color =
    animatedScore >= 7.5 ? "var(--green)"
    : animatedScore >= 5  ? "var(--amber)"
    : "var(--red)";

  return (
    <div
      className="score-ring-wrap"
      aria-label={`Overall score: ${score} out of 10`}
      aria-live="polite"
    >
      <svg
        className="score-ring-svg"
        viewBox="0 0 128 128"
        width="128"
        height="128"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="var(--bg-overlay)"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke var(--transition-normal)",
          }}
        />
      </svg>

      {/* Score value */}
      <div className="score-ring-center">
        <span className="score-ring-value" style={{ color }}>
          {animatedScore % 1 === 0
            ? animatedScore.toFixed(0)
            : animatedScore.toFixed(1)}
        </span>
        <span className="score-ring-denom">/10</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Verdict chip
// ─────────────────────────────────────────────

function VerdictChip({ verdict }) {
  const map = {
    Scale: { cls: "verdict--scale", icon: "↑", label: "Scale" },
    Kill:  { cls: "verdict--kill",  icon: "✕", label: "Kill"  },
    Pivot: { cls: "verdict--pivot", icon: "↻", label: "Pivot" },
    Hold:  { cls: "verdict--hold",  icon: "—", label: "Hold"  },
  };
  const v = map[verdict] || map.Hold;
  return (
    <div className={`verdict-pill ${v.cls}`}>
      <span className="verdict-pill__icon" aria-hidden="true">{v.icon}</span>
      <span className="verdict-pill__label">{v.label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Meta bar — model, time, scrape method
// ─────────────────────────────────────────────

function MetaBar({ model, processingTimeMs, scrapeMethod, charCount, partial }) {
  const seconds = processingTimeMs
    ? (processingTimeMs / 1000).toFixed(1)
    : null;

  return (
    <div className="meta-bar" role="status" aria-label="Analysis metadata">
      {model && (
        <span className="meta-item">
          <span className="meta-item__icon" aria-hidden="true">⬡</span>
          {model.replace("llama-", "LLaMA ").replace("-versatile", "")}
        </span>
      )}
      {seconds && (
        <span className="meta-item">
          <span className="meta-item__icon" aria-hidden="true">◷</span>
          {seconds}s
        </span>
      )}
      {scrapeMethod && (
        <span className="meta-item">
          <span className="meta-item__icon" aria-hidden="true">◈</span>
          via {scrapeMethod}
        </span>
      )}
      {charCount && (
        <span className="meta-item">
          <span className="meta-item__icon" aria-hidden="true">≡</span>
          {charCount.toLocaleString()} chars
        </span>
      )}
      {partial && (
        <span className="meta-item meta-item--warn">
          <span className="meta-item__icon" aria-hidden="true">⚠</span>
          partial result
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Section order — controls render sequence
// ─────────────────────────────────────────────

const SECTION_ORDER = [
  "target_users",
  "pain_points_solved",
  "value_proposition",
  "monetization",
  "growth_mechanics",
  "competitive_landscape",
  "what_works",
  "what_is_missing",
  "red_flags",
];

// ─────────────────────────────────────────────
// Copy to clipboard hook
// ─────────────────────────────────────────────

function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch {
      // Fallback for older browsers / non-HTTPS contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }
  };

  return { copied, copy };
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function TeardownCard({
  data,
  model,
  processingTimeMs,
  scrapeMethod,
  charCount,
  partial = false,
  onReset,
}) {
  // Styles injected first — TEARDOWN_STYLES is defined at module top
  useInjectStyles(TEARDOWN_STYLES);

  const topRef = useRef(null);
  const { copied, copy } = useCopyToClipboard();

  // Scroll to top when a new teardown arrives
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);

  if (!data) return null;

  const verdict = data.pm_verdict || {};
  const score   = verdict.overall_score ?? 0;

  const handleCopy = () => {
    copy(JSON.stringify(data, null, 2));
  };

  return (
    <article
      className="teardown-card animate-fade-up"
      ref={topRef}
      aria-label={`Product teardown: ${data.product_name}`}
    >

      {/* ── HERO HEADER ── */}
      <header className="teardown-hero">

        {/* Top accent line */}
        <div className="teardown-hero__accent" aria-hidden="true" />

        {/* Corner decorations */}
        <div className="teardown-hero__corner teardown-hero__corner--tl" aria-hidden="true" />
        <div className="teardown-hero__corner teardown-hero__corner--br" aria-hidden="true" />

        <div className="teardown-hero__inner">

          {/* Left — product identity */}
          <div className="teardown-hero__identity">
            <div className="teardown-hero__eyebrow animate-slide-right delay-0">
              <span className="classified">teardown</span>
              <span className="dot-sep" aria-hidden="true" />
              <span className="teardown-hero__eyebrow-text">PM Analysis Report</span>
            </div>

            <h1 className="teardown-hero__name animate-fade-up delay-1">
              {data.product_name}
            </h1>

            <p className="teardown-hero__one-liner animate-fade-up delay-2">
              {data.one_liner}
            </p>

            {/* Verdict row */}
            <div className="teardown-hero__verdict-row animate-fade-up delay-3">
              <VerdictChip verdict={verdict.kill_or_scale} />
              {verdict.kill_or_scale_rationale && (
                <p className="teardown-hero__rationale">
                  {verdict.kill_or_scale_rationale}
                </p>
              )}
            </div>
          </div>

          {/* Right — score ring */}
          <div className="teardown-hero__score animate-scale-in delay-2">
            <ScoreRing score={score} />
            <p className="teardown-hero__score-label">PM Score</p>
          </div>
        </div>

        {/* Score rationale */}
        {verdict.score_rationale && (
          <div className="teardown-hero__score-rationale animate-fade-up delay-4">
            <span className="section-label">Score Rationale</span>
            <p className="teardown-hero__score-rationale-text">
              {verdict.score_rationale}
            </p>
          </div>
        )}

        {/* Biggest bet */}
        {verdict.biggest_bet && (
          <div className="teardown-hero__bet animate-fade-up delay-5">
            <span className="teardown-hero__bet-label" aria-hidden="true">
              ⚡ Biggest Bet
            </span>
            <p className="teardown-hero__bet-text">{verdict.biggest_bet}</p>
          </div>
        )}

        {/* Meta bar */}
        <MetaBar
          model={model}
          processingTimeMs={processingTimeMs}
          scrapeMethod={scrapeMethod}
          charCount={charCount}
          partial={partial}
        />
      </header>

      {/* ── SECTIONS ── */}
      <div
        className="teardown-sections"
        role="region"
        aria-label="Teardown sections"
      >
        {SECTION_ORDER.map((key, i) =>
          data[key] ? (
            <Section
              key={key}
              sectionKey={key}
              data={data[key]}
              index={i}
            />
          ) : null
        )}
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <footer className="teardown-footer animate-fade-up">
        <div className="teardown-footer__left">
          <span className="teardown-footer__label">
            Analysis complete
            <span className="dot-sep" aria-hidden="true" />
            <span className="classified">
              {verdict.kill_or_scale || "hold"}
            </span>
          </span>
        </div>
        <div className="teardown-footer__actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleCopy}
            aria-label="Copy teardown as JSON"
          >
            {copied ? "✓ Copied" : "Copy JSON"}
          </button>
          <button
            className="btn btn--secondary btn--sm"
            onClick={onReset}
            aria-label="Start a new teardown"
          >
            New Teardown
          </button>
        </div>
      </footer>

    </article>
  );
}