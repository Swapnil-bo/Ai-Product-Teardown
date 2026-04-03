import { useState, useCallback, useEffect } from "react";
import InputPanel from "./components/InputPanel";
import TeardownCard from "./components/TeardownCard";
import Loader from "./components/Loader";

// ─────────────────────────────────────────────
// Styles — defined first (avoids const init footgun)
// ─────────────────────────────────────────────

const APP_STYLES = `
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Nav ── */
  .app-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-6);
    height: 56px;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  }

  .app-nav--scrolled {
    border-bottom-color: var(--border-strong);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .app-nav__logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    text-decoration: none;
  }

  .app-nav__logo-icon {
    width: 28px;
    height: 28px;
    background: var(--accent);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    color: #fff;
    font-weight: 700;
    font-family: var(--font-mono);
    letter-spacing: -0.02em;
    flex-shrink: 0;
    transition: background var(--transition-fast), transform var(--transition-fast);
  }

  .app-nav__logo:hover .app-nav__logo-icon {
    background: var(--accent-dim);
    transform: scale(1.05);
  }

  .app-nav__logo-text {
    font-family: var(--font-display);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .app-nav__logo-text span {
    color: var(--accent);
  }

  .app-nav__right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .app-nav__status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.06em;
  }

  .app-nav__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    animation: status-pulse 2.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  .app-nav__status-dot--loading {
    background: var(--amber);
    box-shadow: 0 0 6px var(--amber);
    animation: status-pulse 0.8s ease-in-out infinite;
  }

  @keyframes status-pulse {
    0%, 100% { opacity: 0.6; transform: scale(0.9); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }

  .app-nav__new-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.4em 0.9em;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      background var(--transition-fast);
  }

  .app-nav__new-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
    background: var(--bg-elevated);
  }

  /* ── Main ── */
  .app-main {
    flex: 1;
    padding: var(--space-6) var(--space-6) var(--space-9);
    position: relative;
  }

  /* ── View transitions ── */
  .app-view--enter {
    animation: view-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes view-enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Footer ── */
  .app-footer {
    padding: var(--space-5) var(--space-6);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .app-footer__left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .app-footer__divider {
    width: 1px;
    height: 12px;
    background: var(--border);
    flex-shrink: 0;
  }

  .app-footer__link {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .app-footer__link:hover {
    color: var(--accent);
  }

  .app-footer__right {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.06em;
  }

  .app-footer__right a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .app-footer__right a:hover {
    color: var(--accent);
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .app-nav {
      padding: 0 var(--space-4);
    }
    .app-nav__status {
      display: none;
    }
    .app-main {
      padding: var(--space-4) var(--space-4) var(--space-8);
    }
    .app-footer {
      flex-direction: column;
      align-items: flex-start;
      padding: var(--space-4);
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
    tag.setAttribute("data-app-styles", "true");
    tag.textContent = css;
    document.head.appendChild(tag);
    stylesInjected = true;
  }, []);
}

// ─────────────────────────────────────────────
// Scroll detection hook
// ─────────────────────────────────────────────

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

// ─────────────────────────────────────────────
// Document title hook
// ─────────────────────────────────────────────

function useDocumentTitle(result) {
  useEffect(() => {
    if (result?.data?.product_name) {
      document.title = `${result.data.product_name} Teardown — AI Product Teardown`;
    } else {
      document.title = "AI Product Teardown — PM-Style Analysis, Instantly";
    }
  }, [result]);
}

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────

export default function App() {
  useInjectStyles(APP_STYLES);

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewKey, setViewKey] = useState(0);

  const scrolled = useScrolled();
  useDocumentTitle(result);

  const handleResult = useCallback((res) => {
    setResult(res);
    setViewKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setViewKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLoadingChange = useCallback((val) => {
    setLoading(val);
  }, []);

  const isResultView = Boolean(result);

  return (
    <div className="app">

      <nav
        className={`app-nav ${scrolled ? "app-nav--scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div
          className="app-nav__logo"
          onClick={handleReset}
          role="button"
          tabIndex={0}
          aria-label="Go to home"
          onKeyDown={(e) => { if (e.key === "Enter") handleReset(); }}
        >
          <div className="app-nav__logo-icon" aria-hidden="true">PT</div>
          <span className="app-nav__logo-text">
            Product<span>Teardown</span>
          </span>
        </div>

        <div className="app-nav__right">
          <div
            className="app-nav__status"
            role="status"
            aria-label={loading ? "Analyzing" : "Ready"}
            aria-live="polite"
          >
            <div
              className={`app-nav__status-dot ${loading ? "app-nav__status-dot--loading" : ""}`}
              aria-hidden="true"
            />
            {loading ? "Analyzing..." : "Ready"}
          </div>

          {isResultView && !loading && (
            <button
              className="app-nav__new-btn animate-fade-in"
              onClick={handleReset}
              aria-label="Start a new teardown"
            >
              + New
            </button>
          )}
        </div>
      </nav>

      <main className="app-main" id="main-content">
        <Loader isVisible={loading} />

        <div
          key={viewKey}
          className="app-view app-view--enter"
          aria-live="polite"
          aria-atomic="false"
        >
          {isResultView ? (
            <TeardownCard
              data={result.data}
              model={result.model}
              processingTimeMs={result.processingTimeMs}
              scrapeMethod={result.scrapeMethod}
              charCount={result.charCount}
              partial={result.partial}
              onReset={handleReset}
            />
          ) : (
            <InputPanel
              onResult={handleResult}
              onLoadingChange={handleLoadingChange}
            />
          )}
        </div>
      </main>
      <footer className="app-footer" aria-label="Site footer">
  <div className="app-footer__left">
    <span>AI Product Teardown</span>
    <div className="app-footer__divider" aria-hidden="true" />
    <span>LLaMA 3.3 70B on Groq</span>
    <div className="app-footer__divider" aria-hidden="true" />
    <a href="https://github.com/Swapnil-bo/Ai-Product-Teardown" target="_blank" rel="noopener noreferrer" className="app-footer__link">
      GitHub
    </a>
  </div>
  <div className="app-footer__right">
    {"Built by "}
    <a href="https://x.com/SwapnilHazra4" target="_blank" rel="noopener noreferrer">
      @SwapnilHazra4
    </a>
  </div>
</footer>

    </div>
  );
}