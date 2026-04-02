import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// Styles — defined first (avoids const init footgun)
// ─────────────────────────────────────────────

const INPUT_STYLES = `
  /* ── Panel wrapper ── */
  .input-panel {
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* ── Hero headline ── */
  .input-hero {
    text-align: center;
    padding: var(--space-8) 0 var(--space-5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .input-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .input-hero__eyebrow-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    animation: eyebrow-pulse 2s ease-in-out infinite;
  }

  @keyframes eyebrow-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); box-shadow: 0 0 6px var(--accent); }
  }

  .input-hero__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    line-height: 1.05;
    max-width: 18ch;
  }

  .input-hero__title em {
    font-style: normal;
    color: var(--accent);
    position: relative;
  }

  /* Underline decoration on "brutal" */
  .input-hero__title em::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--amber));
    border-radius: 1px;
  }

  .input-hero__sub {
    font-size: 1rem;
    color: var(--text-muted);
    line-height: 1.65;
    max-width: 52ch;
    text-align: center;
  }

  /* ── Stats row ── */
  .input-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .input-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .input-stat__value {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .input-stat__label {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .input-stat-divider {
    width: 1px;
    height: 28px;
    background: var(--border);
  }

  /* ── Main input card ── */
  .input-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    overflow: hidden;
    position: relative;
    transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  }

  .input-card:focus-within {
    border-color: var(--border-accent);
    box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-lg);
  }

  /* Top accent line */
  .input-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--accent) 40%,
      var(--amber) 70%,
      transparent
    );
    opacity: 0;
    transition: opacity var(--transition-normal);
  }

  .input-card:focus-within::before {
    opacity: 1;
  }

  /* ── Tab switcher ── */
  .input-tabs {
    display: flex;
    padding: var(--space-4) var(--space-6) 0;
    gap: var(--space-2);
    border-bottom: 1px solid var(--border);
  }

  .input-tab {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.5em 1em;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    background: transparent;
    color: var(--text-muted);
    transition:
      color var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
    position: relative;
    bottom: -1px;
  }

  .input-tab:hover:not(.input-tab--active) {
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .input-tab--active {
    color: var(--text-primary);
    background: var(--bg-surface);
    border-color: var(--border);
    border-bottom-color: var(--bg-surface);
  }

  .input-tab__icon {
    font-size: 0.8rem;
    line-height: 1;
  }

  /* ── Input body ── */
  .input-body {
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* ── URL input row ── */
  .url-input-wrap {
    display: flex;
    align-items: stretch;
    gap: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .url-input-wrap:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .url-input-wrap:focus-within .url-prefix {
    color: var(--accent);
    border-right-color: rgba(232, 80, 10, 0.2);
  }

  .url-prefix {
    display: flex;
    align-items: center;
    padding: 0 var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--text-muted);
    border-right: 1px solid var(--border);
    background: var(--bg-overlay);
    white-space: nowrap;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    user-select: none;
  }

  .url-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.8em var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.88rem;
    color: var(--text-primary);
    outline: none;
    min-width: 0;
  }

  .url-input::placeholder {
    color: var(--text-muted);
    font-style: normal;
  }

  .url-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    background: transparent;
    border: none;
    border-left: 1px solid var(--border);
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.9rem;
    transition: color var(--transition-fast), background var(--transition-fast);
    flex-shrink: 0;
  }

  .url-clear:hover {
    color: var(--text-primary);
    background: var(--bg-overlay);
  }

  /* ── Description textarea ── */
  .desc-wrap {
    position: relative;
  }

  .desc-textarea {
    width: 100%;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.92rem;
    line-height: 1.7;
    padding: var(--space-4) var(--space-5);
    outline: none;
    resize: none;
    min-height: 140px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .desc-textarea::placeholder {
    color: var(--text-muted);
    font-style: italic;
  }

  .desc-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .desc-char-count {
    position: absolute;
    bottom: var(--space-3);
    right: var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    pointer-events: none;
    transition: color var(--transition-fast);
  }

  .desc-char-count--warn { color: var(--yellow); }
  .desc-char-count--over { color: var(--red); }

  /* ── Example chips ── */
  .examples-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .examples-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    flex-shrink: 0;
    margin-right: var(--space-1);
  }

  .example-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.3em 0.7em;
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
    white-space: nowrap;
  }

  .example-chip:hover {
    color: var(--accent);
    background: var(--accent-subtle);
    border-color: var(--border-accent);
  }

  /* ── Submit row ── */
  .submit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .submit-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .submit-meta__primary {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
  }

  .submit-meta__secondary {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  /* Submit button */
  .submit-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0.7em 1.8em;
    border-radius: var(--radius-md);
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-dim);
    border-color: var(--accent-dim);
    transform: translateY(-1px);
    box-shadow: 0 0 28px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3);
  }

  .submit-btn:hover::before { opacity: 1; }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.97);
    box-shadow: none;
  }

  .submit-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .submit-btn__icon {
    font-size: 1rem;
    line-height: 1;
    transition: transform var(--transition-fast);
  }

  .submit-btn:hover:not(:disabled) .submit-btn__icon {
    transform: translateX(3px);
  }

  /* Loading state shimmer on button */
  .submit-btn--loading {
    pointer-events: none;
  }

  .submit-btn--loading::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.12) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: btn-shimmer 1.2s ease-in-out infinite;
  }

  @keyframes btn-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Error banner ── */
  .input-error {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    background: var(--red-dim);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: var(--radius-md);
    animation: error-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  @keyframes error-shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }

  .input-error__icon {
    font-size: 0.9rem;
    color: var(--red);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .input-error__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .input-error__title {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--red);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .input-error__message {
    font-size: 0.875rem;
    color: #fca5a5;
    line-height: 1.55;
    max-width: none;
  }

  .input-error__dismiss {
    background: transparent;
    border: none;
    color: var(--red);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    opacity: 0.6;
    transition: opacity var(--transition-fast);
    flex-shrink: 0;
    padding: 0;
  }

  .input-error__dismiss:hover { opacity: 1; }

  /* ── How it works ── */
  .how-it-works {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    margin-top: var(--space-3);
  }

  .how-step {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    position: relative;
    overflow: hidden;
    transition: border-color var(--transition-fast);
  }

  .how-step:hover {
    border-color: var(--border-strong);
  }

  .how-step::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 2px;
    height: 100%;
    background: var(--accent);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .how-step:hover::before { opacity: 1; }

  .how-step__num {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--accent);
    letter-spacing: 0.1em;
  }

  .how-step__title {
    font-family: var(--font-display);
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .how-step__desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.55;
    max-width: none;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .input-hero {
      padding: var(--space-6) 0 var(--space-4);
    }

    .input-body {
      padding: var(--space-5) var(--space-4);
    }

    .input-tabs {
      padding: var(--space-3) var(--space-4) 0;
    }

    .how-it-works {
      grid-template-columns: 1fr;
    }

    .submit-row {
      flex-direction: column;
      align-items: stretch;
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
    }

    .input-stats {
      gap: var(--space-4);
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
    tag.setAttribute("data-input-styles", "true");
    tag.textContent = css;
    document.head.appendChild(tag);
    stylesInjected = true;
  }, []);
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MAX_DESCRIPTION_CHARS = 2000;
const MIN_DESCRIPTION_CHARS = 40;

const URL_EXAMPLES = [
  { label: "Notion", value: "https://notion.so" },
  { label: "Linear", value: "https://linear.app" },
  { label: "Figma",  value: "https://figma.com"  },
  { label: "Vercel", value: "https://vercel.com" },
];

const DESC_EXAMPLES = [
  {
    label: "SaaS idea",
    value:
      "A tool for indie hackers that auto-generates landing pages from a GitHub README. You connect your repo, pick a template, and it deploys a marketing site with features pulled from your README automatically.",
  },
  {
    label: "Mobile app",
    value:
      "An app that lets you scan any restaurant menu and instantly get personalized dish recommendations based on your dietary preferences, past orders, and cuisine history.",
  },
  {
    label: "B2B tool",
    value:
      "A Slack bot that automatically summarizes all threads you missed while offline and surfaces the ones that need your attention, ranked by urgency and your role.",
  },
];

const HOW_STEPS = [
  {
    num: "01",
    title: "Drop a URL or describe it",
    desc: "Paste any product URL or write a few sentences about what the product does.",
  },
  {
    num: "02",
    title: "LLaMA 3.3 70B analyzes",
    desc: "Our prompt extracts personas, pain points, monetization, moat, gaps, and red flags.",
  },
  {
    num: "03",
    title: "Get the teardown",
    desc: "A full PM-grade teardown with a score, verdict, and board-room-ready insights.",
  },
];

// ─────────────────────────────────────────────
// URL validator (client-side pre-check)
// ─────────────────────────────────────────────

function isValidUrl(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function InputPanel({ onResult, onLoadingChange }) {
  useInjectStyles(INPUT_STYLES);

  const [tab, setTab]               = useState("url");      // "url" | "description"
  const [url, setUrl]               = useState("");
  const [description, setDesc]      = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const urlInputRef                 = useRef(null);
  const descInputRef                = useRef(null);
  const abortRef                    = useRef(null);          // AbortController ref

  // Sync loading state up to App
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Focus the active input when tab changes
  useEffect(() => {
    setError(null);
    if (tab === "url") {
      setTimeout(() => urlInputRef.current?.focus(), 50);
    } else {
      setTimeout(() => descInputRef.current?.focus(), 50);
    }
  }, [tab]);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Derived state ──
  const descLength  = description.length;
  const descOver    = descLength > MAX_DESCRIPTION_CHARS;
  const descWarn    = descLength > MAX_DESCRIPTION_CHARS * 0.85;
  const canSubmit   = !loading && !descOver && (
    tab === "url"
      ? url.trim().length > 0
      : description.trim().length >= MIN_DESCRIPTION_CHARS
  );

  // ── Handlers ──
  const handleTabChange = useCallback((newTab) => {
    if (newTab === tab || loading) return;
    setTab(newTab);
  }, [tab, loading]);

  const handleUrlExample = useCallback((val) => {
    setUrl(val);
    setError(null);
    urlInputRef.current?.focus();
  }, []);

  const handleDescExample = useCallback((val) => {
    setDesc(val);
    setError(null);
    descInputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);

    // Client-side URL pre-validation
    if (tab === "url" && !isValidUrl(url.trim())) {
      setError("Please enter a valid product URL (e.g. https://notion.so)");
      urlInputRef.current?.focus();
      return;
    }

    // Client-side description length check
    if (tab === "description" && description.trim().length < MIN_DESCRIPTION_CHARS) {
      setError(`Description too short — write at least ${MIN_DESCRIPTION_CHARS} characters.`);
      descInputRef.current?.focus();
      return;
    }

    setLoading(true);

    // Abort any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const body =
        tab === "url"
          ? { input_type: "url", url: url.trim() }
          : { input_type: "description", description: description.trim() };

      const res = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      const json = await res.json();

      if (!res.ok) {
        // FastAPI sends error detail as a string
        const msg =
          typeof json.detail === "string"
            ? json.detail
            : json.error || "Something went wrong. Please try again.";
        throw new Error(msg);
      }

      if (!json.success || !json.data) {
        throw new Error(json.error || "The analysis returned no data. Please try again.");
      }

      onResult?.({
        data:              json.data,
        model:             json.model,
        processingTimeMs:  json.processing_time_ms,
        scrapeMethod:      json.scrape_method,
        charCount:         json.char_count,
        partial:           json.partial,
        requestId:         json.request_id,
      });

    } catch (err) {
      if (err.name === "AbortError") return; // user navigated away — silent
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, tab, url, description, onResult]);

  // Keyboard shortcut — Cmd/Ctrl + Enter to submit
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // ── Char counter class ──
  const charCountClass = descOver
    ? "desc-char-count desc-char-count--over"
    : descWarn
    ? "desc-char-count desc-char-count--warn"
    : "desc-char-count";

  return (
    <div className="input-panel" onKeyDown={handleKeyDown}>

      {/* ── HERO ── */}
      <div className="input-hero animate-fade-up delay-0">
        <div className="input-hero__eyebrow">
          <div className="input-hero__eyebrow-dot" aria-hidden="true" />
          AI-Powered · LLaMA 3.3 70B · Groq Inference
        </div>

        <h1 className="input-hero__title">
          The <em>brutal</em> PM teardown
        </h1>

        <p className="input-hero__sub">
          Drop a product URL or describe any product.
          Get a board-room-grade PM analysis — personas, pain points,
          monetization gaps, moat, and a kill-or-scale verdict.
        </p>

        {/* Stats */}
        <div className="input-stats" aria-label="Analysis stats">
          <div className="input-stat">
            <span className="input-stat__value">12</span>
            <span className="input-stat__label">Sections</span>
          </div>
          <div className="input-stat-divider" aria-hidden="true" />
          <div className="input-stat">
            <span className="input-stat__value">70B</span>
            <span className="input-stat__label">Parameters</span>
          </div>
          <div className="input-stat-divider" aria-hidden="true" />
          <div className="input-stat">
            <span className="input-stat__value">~15s</span>
            <span className="input-stat__label">Avg. Time</span>
          </div>
          <div className="input-stat-divider" aria-hidden="true" />
          <div className="input-stat">
            <span className="input-stat__value">Free</span>
            <span className="input-stat__label">Always</span>
          </div>
        </div>
      </div>

      {/* ── INPUT CARD ── */}
      <div className="input-card animate-fade-up delay-2">

        {/* Tabs */}
        <div className="input-tabs" role="tablist" aria-label="Input method">
          <button
            className={`input-tab ${tab === "url" ? "input-tab--active" : ""}`}
            onClick={() => handleTabChange("url")}
            role="tab"
            aria-selected={tab === "url"}
            aria-controls="input-url-panel"
            id="tab-url"
            disabled={loading}
          >
            <span className="input-tab__icon" aria-hidden="true">◈</span>
            Product URL
          </button>
          <button
            className={`input-tab ${tab === "description" ? "input-tab--active" : ""}`}
            onClick={() => handleTabChange("description")}
            role="tab"
            aria-selected={tab === "description"}
            aria-controls="input-desc-panel"
            id="tab-desc"
            disabled={loading}
          >
            <span className="input-tab__icon" aria-hidden="true">≡</span>
            Description
          </button>
        </div>

        {/* Body */}
        <div className="input-body">

          {/* URL tab panel */}
          {tab === "url" && (
            <div
              id="input-url-panel"
              role="tabpanel"
              aria-labelledby="tab-url"
              className="animate-fade-in"
            >
              <div className="url-input-wrap">
                <span className="url-prefix" aria-hidden="true">URL</span>
                <input
                  ref={urlInputRef}
                  type="url"
                  className="url-input"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(null); }}
                  placeholder="https://notion.so"
                  aria-label="Product URL"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={loading}
                />
                {url && (
                  <button
                    className="url-clear"
                    onClick={() => { setUrl(""); setError(null); urlInputRef.current?.focus(); }}
                    aria-label="Clear URL"
                    tabIndex={0}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* URL examples */}
              <div className="examples-row" style={{ marginTop: "var(--space-3)" }}>
                <span className="examples-label">Try</span>
                {URL_EXAMPLES.map((ex) => (
                  <button
                    key={ex.value}
                    className="example-chip"
                    onClick={() => handleUrlExample(ex.value)}
                    disabled={loading}
                    aria-label={`Use ${ex.label} as example`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description tab panel */}
          {tab === "description" && (
            <div
              id="input-desc-panel"
              role="tabpanel"
              aria-labelledby="tab-desc"
              className="animate-fade-in"
            >
              <div className="desc-wrap">
                <textarea
                  ref={descInputRef}
                  className="desc-textarea"
                  value={description}
                  onChange={(e) => { setDesc(e.target.value); setError(null); }}
                  placeholder="Describe the product in a few sentences — what it does, who it's for, how it makes money..."
                  aria-label="Product description"
                  aria-describedby="desc-char-counter"
                  maxLength={MAX_DESCRIPTION_CHARS + 100}
                  disabled={loading}
                  rows={5}
                />
                <span
                  id="desc-char-counter"
                  className={charCountClass}
                  aria-live="polite"
                  aria-label={`${descLength} of ${MAX_DESCRIPTION_CHARS} characters`}
                >
                  {descLength}/{MAX_DESCRIPTION_CHARS}
                </span>
              </div>

              {/* Description examples */}
              <div className="examples-row" style={{ marginTop: "var(--space-3)" }}>
                <span className="examples-label">Try</span>
                {DESC_EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="example-chip"
                    onClick={() => handleDescExample(ex.value)}
                    disabled={loading}
                    aria-label={`Use ${ex.label} as example`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="input-error animate-fade-in"
              role="alert"
              aria-live="assertive"
            >
              <span className="input-error__icon" aria-hidden="true">⚠</span>
              <div className="input-error__body">
                <span className="input-error__title">Error</span>
                <p className="input-error__message">{error}</p>
              </div>
              <button
                className="input-error__dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Submit row */}
          <div className="submit-row">
            <div className="submit-meta">
              <span className="submit-meta__primary">
                {tab === "url"
                  ? "Scrapes the URL then runs full PM analysis"
                  : "Runs PM analysis directly on your description"}
              </span>
              <span className="submit-meta__secondary">
                ⌘ + Enter to submit · ~10–20 seconds
              </span>
            </div>

            <button
              className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="Run teardown analysis"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="submit-btn__icon" aria-hidden="true">◷</span>
                  Analyzing...
                </>
              ) : (
                <>
                  Run Teardown
                  <span className="submit-btn__icon" aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="how-it-works animate-fade-up delay-4" aria-label="How it works">
        {HOW_STEPS.map((step, i) => (
          <div
            key={step.num}
            className="how-step animate-fade-up"
            style={{ animationDelay: `${400 + i * 80}ms` }}
          >
            <span className="how-step__num">{step.num}</span>
            <span className="how-step__title">{step.title}</span>
            <p className="how-step__desc">{step.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}