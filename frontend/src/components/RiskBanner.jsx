import { riskLevelFromApi, displayTitleCase } from "../utils/clinicalMerge.js"

const ACTION = {
  high: ["Refer to hospital immediately.", "Do not delay."],
  medium: ["Monitor closely.", "Prepare for possible referral."],
  low: ["Continue home management.", "Review in 7 days."],
  unknown: ["Follow programme protocols.", "Consult supervisor when uncertain."],
}

const HEADLINE = {
  high: "HIGH RISK",
  medium: "MONITOR CLOSELY",
  low: "CONTINUE HOME CARE",
  unknown: "RISK LEVEL",
}

export default function RiskBanner({ result }) {
  const apiRisk = result?.risk
  const level = riskLevelFromApi(apiRisk)
  const lines = ACTION[level]
  const headline = HEADLINE[level]
  const pt = displayTitleCase((result?.patient_type || "unknown").toString())
  const riskTag = (apiRisk || "—").toString().toUpperCase()
  const pulse = level === "high"

  return (
    <section className={`rb rb--${level} ${pulse ? "rb--pulse" : ""}`}>
      <div className="rb__row">
        <div className="rb__badges">
          <span className="rb__pill rb__pill--pt">Patient: {pt}</span>
          <span className={`rb__pill rb__pill--risk rb__pill--${level}`}>Risk: {riskTag}</span>
        </div>
        <div className="rb__copy">
          <p className="rb__micro">RISK ASSESSMENT</p>
          <h2 className="rb__title">{headline}</h2>
          <div className="rb__acts">
            <p>{lines[0]}</p>
            <p>{lines[1]}</p>
          </div>
        </div>
      </div>
      <style>{`
        .rb {
          width: 100%;
          padding: 22px 20px 24px;
          margin: 0;
          border-bottom: 1px solid #d8ede8;
          border-left: 6px solid transparent;
          opacity: 0;
          animation: rb-fade-up 0.48s ease forwards;
        }
        .rb--pulse {
          animation:
            rb-fade-up 0.48s ease forwards,
            rb-border-pulse-high 1.5s ease-in-out infinite 0.48s;
        }
        @keyframes rb-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes rb-border-pulse-high {
          0%,
          100% {
            border-left-color: #dc2626;
          }
          50% {
            border-left-color: #f87171;
          }
        }
        .rb--high {
          background: #fff5f5;
          border-left-color: #dc2626;
        }
        .rb--medium {
          background: #fffbeb;
          border-left-color: #d97706;
        }
        .rb--low {
          background: #f0fdf4;
          border-left-color: #16a34a;
        }
        .rb--unknown {
          background: #f9fafb;
          border-left-color: #9ca3af;
        }
        .rb__row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }
        .rb__badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          align-self: flex-end;
          order: -1;
        }
        @media (min-width: 520px) {
          .rb__row {
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: flex-start;
          }
          .rb__badges {
            order: 1;
            flex-direction: column;
            align-items: flex-end;
            flex-shrink: 0;
            margin-left: 16px;
          }
        }
        .rb__copy {
          flex: 1;
          min-width: 0;
          order: 0;
        }
        @media (min-width: 520px) {
          .rb__copy {
            order: 0;
          }
        }
        .rb__micro {
          margin: 0 0 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d5c4a;
        }
        .rb__title {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .rb--high .rb__title {
          color: #dc2626;
        }
        .rb--medium .rb__title {
          color: #d97706;
        }
        .rb--low .rb__title {
          color: #16a34a;
        }
        .rb--unknown .rb__title {
          color: #111827;
        }
        .rb__acts p {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
          color: #111827;
        }
        .rb__acts p:last-child {
          margin-bottom: 0;
        }
        .rb__pill {
          font-size: 11px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 999px;
          max-width: 100%;
          text-align: center;
          border: 1px solid #d8ede8;
          background: #ffffff;
          color: #111827;
        }
        .rb__pill--pt {
          color: #111827;
        }
        .rb__pill--risk.rb__pill--high {
          border-color: rgba(220, 38, 38, 0.35);
          background: #fff5f5;
          color: #dc2626;
        }
        .rb__pill--risk.rb__pill--medium {
          border-color: rgba(217, 119, 6, 0.35);
          background: #fffbeb;
          color: #d97706;
        }
        .rb__pill--risk.rb__pill--low {
          border-color: rgba(22, 163, 74, 0.35);
          background: #f0fdf4;
          color: #16a34a;
        }
        .rb__pill--risk.rb__pill--unknown {
          background: #f9fafb;
          color: #111827;
        }
        @media (min-width: 768px) {
          .rb__title {
            font-size: 32px;
          }
          .rb__acts p {
            font-size: 16px;
            line-height: 1.7;
          }
        }
      `}</style>
    </section>
  )
}
