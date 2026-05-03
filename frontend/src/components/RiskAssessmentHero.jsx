import { riskLevelFromApi } from "../utils/clinicalMerge.js"
import { SvgRiskHigh, SvgRiskLow, SvgRiskMedium, SvgRiskUnknown } from "./SvgClinical.jsx"

const ACTION_LINES = {
  high: ["Refer to hospital immediately.", "Do not delay."],
  medium: ["Monitor closely.", "Prepare for possible referral."],
  low: ["Continue home management.", "Review in 7 days."],
  unknown: ["Review with programme protocols", "and your supervisor as needed."],
}

const LABEL = {
  high: "HIGH RISK",
  medium: "MEDIUM RISK",
  low: "LOW RISK",
  unknown: "RISK LEVEL",
}

function RiskIcon({ level }) {
  if (level === "high") return <SvgRiskHigh size={26} stroke="#dc2626" />
  if (level === "medium") return <SvgRiskMedium size={26} stroke="#d97706" />
  if (level === "low") return <SvgRiskLow size={26} stroke="#16a34a" />
  return <SvgRiskUnknown size={26} />
}

export default function RiskAssessmentHero({ risk }) {
  const level = riskLevelFromApi(risk)
  const lines = ACTION_LINES[level]
  const label = LABEL[level]
  const isHigh = level === "high"

  return (
    <section
      className={`risk-card risk-card--${level} ${isHigh ? "risk-card--pulse" : ""}`}
      aria-label="Risk assessment"
    >
      <p className="risk-card__label">RISK ASSESSMENT</p>
      <div className="risk-card__top">
        <h2 className="risk-card__title">{label}</h2>
        <div className="risk-card__icon">
          <RiskIcon level={level} />
        </div>
      </div>
      <div className="risk-card__action">
        <p>{lines[0]}</p>
        <p>{lines[1]}</p>
      </div>

      <style>{`
        .risk-card {
          width: 100%;
          padding: 20px;
          border-radius: 14px;
          border: 1px solid var(--border);
          border-left-width: 5px;
          background: var(--surface);
          box-shadow: var(--shadow-card);
        }
        .risk-card--pulse {
          animation: risk-edge-pulse 1.5s ease-in-out infinite;
        }
        .risk-card--high {
          background: var(--color-high-bg);
          border-left-color: var(--color-high-border);
          border-color: rgba(220, 38, 38, 0.25);
        }
        .risk-card--medium {
          background: var(--color-medium-bg);
          border-left-color: var(--color-medium-border);
          border-color: rgba(217, 119, 6, 0.25);
        }
        .risk-card--low {
          background: var(--color-low-bg);
          border-left-color: var(--color-low-border);
          border-color: rgba(22, 163, 74, 0.25);
        }
        .risk-card--unknown {
          background: #f9fafb;
          border-left-color: #9ca3af;
        }
        .risk-card__label {
          margin: 0 0 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .risk-card--high .risk-card__label {
          color: var(--color-high-text);
        }
        .risk-card--medium .risk-card__label {
          color: var(--color-medium-text);
        }
        .risk-card--low .risk-card__label {
          color: var(--color-low-text);
        }
        .risk-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .risk-card__title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .risk-card--high .risk-card__title {
          color: var(--color-high-text);
        }
        .risk-card--medium .risk-card__title {
          color: var(--color-medium-text);
        }
        .risk-card--low .risk-card__title {
          color: var(--color-low-text);
        }
        .risk-card--unknown .risk-card__title {
          color: var(--text-muted);
          font-size: 18px;
        }
        .risk-card__icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .risk-card__action p {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.55;
        }
        .risk-card__action p:last-child {
          margin-bottom: 0;
        }
        .risk-card--high .risk-card__action p {
          color: var(--color-high-text);
        }
        .risk-card--medium .risk-card__action p {
          color: var(--color-medium-text);
        }
        .risk-card--low .risk-card__action p {
          color: var(--color-low-text);
        }
        .risk-card--unknown .risk-card__action p {
          color: var(--text-muted);
        }
      `}</style>
    </section>
  )
}
