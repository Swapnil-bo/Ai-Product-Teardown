import { useState } from "react";

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const s = severity?.toLowerCase();
  const map = {
    critical: "severity--critical",
    high:     "severity--high",
    medium:   "severity--medium",
    low:      "severity--low",
  };
  return (
    <span className={`severity ${map[s] || "severity--low"}`}>
      {severity}
    </span>
  );
}

function OpportunityBadge({ size }) {
  const map = {
    High:   "badge--accent",
    Medium: "badge--amber",
    Low:    "badge--default",
  };
  return (
    <span className={`badge ${map[size] || "badge--default"}`}>
      {size}
    </span>
  );
}

function BopBadge({ value }) {
  const map = {
    Build:   "badge--green",
    Partner: "badge--amber",
    Acquire: "badge--red",
  };
  return (
    <span className={`badge ${map[value] || "badge--default"}`}>
      {value}
    </span>
  );
}

function FieldRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="section-field-row">
      <span className="section-field-label">{label}</span>
      <span className={`section-field-value ${mono ? "section-field-value--mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ListItem({ children, index }) {
  return (
    <li className="section-list-item animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <span className="section-list-item__index">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="section-list-item__content">{children}</span>
    </li>
  );
}

function CollapsibleCard({ title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible-card ${open ? "collapsible-card--open" : ""}`}>
      <button
        className="collapsible-card__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="collapsible-card__title">{title}</span>
        <div className="collapsible-card__meta">
          {badge}
          <span className="collapsible-card__chevron" aria-hidden="true">
            {open ? "−" : "+"}
          </span>
        </div>
      </button>
      {open && (
        <div className="collapsible-card__body animate-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Section renderers — one per teardown key
// ─────────────────────────────────────────────

function TargetUsers({ data }) {
  return (
    <div className="section-content">
      <div className="target-user-grid">
        <div className="target-user-card target-user-card--primary animate-fade-up delay-0">
          <span className="section-label section-label--accent">Primary</span>
          <p className="target-user-card__text">{data.primary}</p>
        </div>
        <div className="target-user-card animate-fade-up delay-1">
          <span className="section-label">Secondary</span>
          <p className="target-user-card__text">{data.secondary}</p>
        </div>
        <div className="target-user-card target-user-card--excluded animate-fade-up delay-2">
          <span className="section-label">Not For</span>
          <p className="target-user-card__text">{data.who_its_not_for}</p>
        </div>
      </div>
    </div>
  );
}

function PainPoints({ data }) {
  return (
    <div className="section-content">
      <div className="pain-list">
        {data.map((item, i) => (
          <CollapsibleCard
            key={i}
            title={item.pain}
            badge={<SeverityBadge severity={item.severity} />}
            defaultOpen={i === 0}
          >
            <p className="collapsible-card__insight">{item.insight}</p>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

function ValueProposition({ data }) {
  return (
    <div className="section-content">
      <div className="vp-grid">
        <div className="vp-block animate-fade-up delay-0">
          <span className="section-label">Core Promise</span>
          <p className="vp-block__text">{data.core_promise}</p>
        </div>
        <div className="vp-block animate-fade-up delay-1">
          <span className="section-label">Differentiation</span>
          <p className="vp-block__text">{data.differentiation}</p>
        </div>
        <div className="vp-block vp-block--aha animate-fade-up delay-2">
          <span className="section-label section-label--accent">⚡ Aha Moment</span>
          <p className="vp-block__text">{data.aha_moment}</p>
        </div>
      </div>
    </div>
  );
}

function Monetization({ data }) {
  return (
    <div className="section-content">
      <div className="mono-grid">
        <FieldRow label="Model"    value={data.current_model} />
        <FieldRow label="Strategy" value={data.pricing_strategy} />
        <FieldRow label="Gap"      value={data.gaps} />
      </div>
      {data.revenue_levers?.length > 0 && (
        <div className="lever-list">
          <span className="section-label" style={{ marginTop: "var(--space-4)" }}>
            Revenue Levers
          </span>
          <ul className="section-plain-list">
            {data.revenue_levers.map((lever, i) => (
              <ListItem key={i} index={i}>{lever}</ListItem>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GrowthMechanics({ data }) {
  const fields = [
    { label: "Acquisition", value: data.acquisition },
    { label: "Activation",  value: data.activation },
    { label: "Retention",   value: data.retention },
    { label: "Referral",    value: data.referral },
    { label: "Expansion",   value: data.expansion },
  ];
  return (
    <div className="section-content">
      <div className="growth-grid">
        {fields.map(({ label, value }, i) => (
          value && (
            <div
              key={label}
              className="growth-cell animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="growth-cell__label">{label}</span>
              <p className="growth-cell__value">{value}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function CompetitiveLandscape({ data }) {
  return (
    <div className="section-content">
      <div className="comp-grid">
        <div className="comp-column animate-fade-up delay-0">
          <span className="section-label">Direct</span>
          <ul className="section-plain-list">
            {data.direct_competitors?.map((c, i) => (
              <ListItem key={i} index={i}>{c}</ListItem>
            ))}
          </ul>
        </div>
        <div className="comp-column animate-fade-up delay-2">
          <span className="section-label">Indirect</span>
          <ul className="section-plain-list">
            {data.indirect_competitors?.map((c, i) => (
              <ListItem key={i} index={i}>{c}</ListItem>
            ))}
          </ul>
        </div>
      </div>
      <div className="comp-footer">
        <FieldRow label="Moat"          value={data.moat} />
        <FieldRow label="Vulnerability" value={data.vulnerability} />
      </div>
    </div>
  );
}

function WhatWorks({ data }) {
  return (
    <div className="section-content">
      <div className="works-list">
        {data.map((item, i) => (
          <div
            key={i}
            className="works-item animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="works-item__number">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="works-item__body">
              <p className="works-item__observation">{item.observation}</p>
              <p className="works-item__why">
                <span className="works-item__why-label">Why it works →</span>
                {item.why_it_works}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIsMissing({ data }) {
  return (
    <div className="section-content">
      <div className="missing-list">
        {data.map((item, i) => (
          <div
            key={i}
            className="missing-item animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="missing-item__header">
              <p className="missing-item__gap">{item.gap}</p>
              <div className="missing-item__badges">
                <OpportunityBadge size={item.opportunity_size} />
                <BopBadge value={item.build_or_partner} />
              </div>
            </div>
            <p className="missing-item__impact">{item.user_impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedFlags({ data }) {
  return (
    <div className="section-content">
      <div className="flags-list">
        {data.map((item, i) => (
          <div
            key={i}
            className={`flag-item flag-item--${item.severity?.toLowerCase()} animate-fade-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flag-item__header">
              <SeverityBadge severity={item.severity} />
              <p className="flag-item__flag">{item.flag}</p>
            </div>
            <p className="flag-item__rec">
              <span className="flag-item__rec-label">Recommendation →</span>
              {item.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section config map
// ─────────────────────────────────────────────

const SECTION_CONFIG = {
  target_users:          { label: "Target Users",          icon: "◎", component: TargetUsers },
  pain_points_solved:    { label: "Pain Points Solved",    icon: "⚠", component: PainPoints },
  value_proposition:     { label: "Value Proposition",     icon: "◆", component: ValueProposition },
  monetization:          { label: "Monetization",          icon: "▲", component: Monetization },
  growth_mechanics:      { label: "Growth Mechanics",      icon: "↗", component: GrowthMechanics },
  competitive_landscape: { label: "Competitive Landscape", icon: "⊞", component: CompetitiveLandscape },
  what_works:            { label: "What Works",            icon: "✓", component: WhatWorks },
  what_is_missing:       { label: "What's Missing",        icon: "□", component: WhatIsMissing },
  red_flags:             { label: "Red Flags",             icon: "⚑", component: RedFlags },
};

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function Section({ sectionKey, data, index = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  const config = SECTION_CONFIG[sectionKey];
  if (!config || !data) return null;

  const Renderer = config.component;

  return (
    <section
      className="teardown-section animate-fade-up card"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-label={config.label}
    >
      {/* Section header */}
      <div className="teardown-section__header">
        <div className="teardown-section__title-row">
          <span className="teardown-section__icon" aria-hidden="true">
            {config.icon}
          </span>
          <h3 className="teardown-section__title">{config.label}</h3>
        </div>
        <button
          className="teardown-section__toggle btn btn--ghost btn--sm"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${config.label}` : `Collapse ${config.label}`}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <div className="teardown-section__divider" aria-hidden="true" />

      {/* Section body */}
      {!collapsed && <Renderer data={data} />}

      <style>{`
        /* ── Section wrapper ── */
        .teardown-section {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: border-color var(--transition-normal);
        }

        .teardown-section:hover {
          border-color: var(--border-strong);
        }

        .teardown-section__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5) var(--space-6);
        }

        .teardown-section__title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .teardown-section__icon {
          font-size: 0.9rem;
          color: var(--accent);
          line-height: 1;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .teardown-section__title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--text-primary);
        }

        .teardown-section__toggle {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          padding: 0.3em 0.7em;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }

        .teardown-section__toggle:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
        }

        .teardown-section__divider {
          height: 1px;
          background: var(--border);
          margin: 0 var(--space-6);
        }

        .section-content {
          padding: var(--space-6);
        }

        /* ── Field rows ── */
        .section-field-row {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          padding: var(--space-4) 0;
          border-bottom: 1px solid var(--border);
        }

        .section-field-row:last-child {
          border-bottom: none;
        }

        .section-field-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .section-field-value {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: none;
        }

        .section-field-value--mono {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--accent);
        }

        /* ── List items ── */
        .section-plain-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }

        .section-list-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: border-color var(--transition-fast);
        }

        .section-list-item:hover {
          border-color: var(--border-strong);
        }

        .section-list-item__index {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--accent);
          letter-spacing: 0.05em;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .section-list-item__content {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.55;
          max-width: none;
        }

        /* ── Collapsible cards ── */
        .collapsible-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: var(--space-3);
          transition: border-color var(--transition-fast);
        }

        .collapsible-card:last-child { margin-bottom: 0; }

        .collapsible-card--open {
          border-color: var(--border-strong);
        }

        .collapsible-card__header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          background: var(--bg-elevated);
          border: none;
          cursor: pointer;
          text-align: left;
          gap: var(--space-4);
          transition: background var(--transition-fast);
        }

        .collapsible-card__header:hover {
          background: var(--bg-overlay);
        }

        .collapsible-card__title {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          flex: 1;
        }

        .collapsible-card__meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .collapsible-card__chevron {
          font-family: var(--font-mono);
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1;
          width: 16px;
          text-align: center;
        }

        .collapsible-card__body {
          padding: var(--space-4) var(--space-5);
          background: var(--bg-surface);
          border-top: 1px solid var(--border);
        }

        .collapsible-card__insight {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: none;
        }

        /* ── Target users ── */
        .target-user-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .target-user-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-4) var(--space-5);
        }

        .target-user-card:last-child {
          grid-column: 1 / -1;
        }

        .target-user-card--primary {
          border-color: var(--border-accent);
          background: var(--accent-subtle);
        }

        .target-user-card--excluded {
          border-color: rgba(239, 68, 68, 0.2);
          background: var(--red-dim);
        }

        .target-user-card__text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-top: var(--space-2);
          max-width: none;
        }

        /* ── Value proposition ── */
        .vp-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .vp-block {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-4) var(--space-5);
        }

        .vp-block--aha {
          border-color: var(--border-accent);
          background: linear-gradient(
            135deg,
            var(--accent-subtle),
            var(--bg-elevated)
          );
        }

        .vp-block__text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-top: var(--space-2);
          max-width: none;
        }

        /* ── Monetization ── */
        .mono-grid {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0 var(--space-5);
        }

        .lever-list { margin-top: var(--space-5); }

        /* ── Growth mechanics ── */
        .growth-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .growth-cell {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-4) var(--space-4);
          transition: border-color var(--transition-fast);
        }

        .growth-cell:hover { border-color: var(--border-strong); }

        .growth-cell:first-child {
          grid-column: 1 / -1;
          border-color: var(--border-accent);
          background: var(--accent-subtle);
        }

        .growth-cell__label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          display: block;
          margin-bottom: var(--space-2);
        }

        .growth-cell__value {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: none;
        }

        /* ── Competitive landscape ── */
        .comp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-5);
          margin-bottom: var(--space-5);
        }

        .comp-column {}

        .comp-footer {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0 var(--space-5);
        }

        /* ── What works ── */
        .works-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .works-item {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
          padding: var(--space-4) var(--space-5);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          border-left: 2px solid var(--green);
          transition: border-color var(--transition-fast);
        }

        .works-item:hover { border-color: rgba(34,197,94,0.4); }

        .works-item__number {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--green);
          flex-shrink: 0;
          margin-top: 3px;
          letter-spacing: 0.05em;
        }

        .works-item__body {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .works-item__observation {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
          max-width: none;
        }

        .works-item__why {
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: none;
        }

        .works-item__why-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--green);
          letter-spacing: 0.04em;
          margin-right: var(--space-2);
        }

        /* ── What's missing ── */
        .missing-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .missing-item {
          padding: var(--space-4) var(--space-5);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          border-left: 2px solid var(--amber);
          transition: border-color var(--transition-fast);
        }

        .missing-item:hover { border-color: rgba(240,165,0,0.4); }

        .missing-item__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .missing-item__gap {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          max-width: none;
          flex: 1;
        }

        .missing-item__badges {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .missing-item__impact {
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: none;
        }

        /* ── Red flags ── */
        .flags-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .flag-item {
          padding: var(--space-4) var(--space-5);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          border-left: 2px solid var(--text-muted);
        }

        .flag-item--critical {
          border-left-color: var(--red);
          background: linear-gradient(135deg, var(--red-dim), var(--bg-elevated));
        }

        .flag-item--high {
          border-left-color: var(--accent);
          background: linear-gradient(135deg, var(--accent-subtle), var(--bg-elevated));
        }

        .flag-item--medium {
          border-left-color: var(--yellow);
          background: linear-gradient(135deg, var(--yellow-dim), var(--bg-elevated));
        }

        .flag-item__header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .flag-item__flag {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          flex: 1;
          max-width: none;
        }

        .flag-item__rec {
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: none;
        }

        .flag-item__rec-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
          margin-right: var(--space-2);
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .target-user-grid,
          .growth-grid,
          .comp-grid {
            grid-template-columns: 1fr;
          }

          .target-user-card:last-child {
            grid-column: auto;
          }

          .teardown-section__header {
            padding: var(--space-4) var(--space-4);
          }

          .section-content {
            padding: var(--space-4);
          }

          .missing-item__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .missing-item__badges {
            justify-content: flex-start;
          }
        }
      `}</style>
    </section>
  );
}