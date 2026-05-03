import { useMemo } from "react"
import { mergeClinical, formatClinicalValue, displayTitleCase, formatAgentDisplayName } from "../utils/clinicalMerge.js"

function RiskBadge({ risk }) {
  const r = (risk || "—").toString().toUpperCase()
  let cls = "crt-badge crt-badge--unknown"
  if (r === "HIGH") cls = "crt-badge crt-badge--high"
  else if (r === "MEDIUM") cls = "crt-badge crt-badge--medium"
  else if (r === "LOW") cls = "crt-badge crt-badge--low"
  return <span className={cls}>{r}</span>
}

function UrgencyValue({ apiRisk, text }) {
  const r = (apiRisk || "").toString().toUpperCase()
  let cls = "crt__val crt__val--urg"
  if (r === "HIGH") cls += " crt__val--urg-high"
  else if (r === "MEDIUM") cls += " crt__val--urg-medium"
  else if (r === "LOW") cls += " crt__val--urg-low"
  else cls += " crt__val--urg-unk"
  return <span className={cls}>{text || "—"}</span>
}

export default function ClinicalRecordTable({ result, sheet = false }) {
  const { rows, apiRisk } = useMemo(() => {
    const merged = mergeClinical(result?.triage, result?.specialist)
    const risk = (result?.risk || merged.risk || "—").toString()
    const gest = formatClinicalValue(merged.gestational_age).trim()
    const facility = formatClinicalValue(merged.referral_facility).trim()
    const urgency = formatClinicalValue(merged.referral_urgency).trim()
    const agentLabel = formatAgentDisplayName(result?.agent_used)

    const list = [
      {
        key: "pt",
        label: "Patient type",
        value: displayTitleCase(formatClinicalValue(merged.patient_type) || "unknown"),
        type: "text",
      },
      { key: "risk", label: "Risk level", value: risk.toUpperCase(), type: "risk" },
    ]
    if (gest && gest !== "—") {
      list.push({ key: "gest", label: "Gestational age", value: displayTitleCase(gest), type: "text" })
    }
    list.push(
      { key: "concern", label: "Main concern", value: displayTitleCase(formatClinicalValue(merged.primary_concern) || "—"), type: "text" },
      { key: "fac", label: "Referral facility", value: displayTitleCase(facility || "—"), type: "text" },
      { key: "urg", label: "Referral urgency", value: displayTitleCase(urgency || "—"), type: "urgency" },
      { key: "agent", label: "Agent used", value: agentLabel, type: "text" }
    )

    return { rows: list, apiRisk: risk }
  }, [result])

  return (
    <section className={`crt ${sheet ? "crt--sheet" : ""}`} style={{ animationDelay: "400ms" }}>
      <h2 className="crt__title">FULL CLINICAL RECORD</h2>
      <div className="crt__table">
        {rows.map((row, i) => (
          <div key={row.key} className={`crt__row ${i % 2 === 1 ? "crt__row--alt" : ""}`}>
            <div className="crt__label">{row.label}</div>
            <div className="crt__value">
              {row.type === "risk" ? (
                <RiskBadge risk={row.value} />
              ) : row.type === "urgency" ? (
                <UrgencyValue apiRisk={apiRisk} text={row.value} />
              ) : (
                <span className="crt__val">{row.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .crt {
          opacity: 0;
          animation: crt-fade-up 0.5s ease forwards;
        }
        @keyframes crt-fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .crt.crt--sheet {
          background: #f0faf6;
          border: 1px solid #b8dcd4;
          border-left: 3px solid #0d5c4a;
          border-radius: 12px;
          padding: 20px;
          box-shadow: none;
        }
        .crt:not(.crt--sheet) {
          background: #f0faf6;
          border: 1px solid #b8dcd4;
          border-left: 3px solid #0d5c4a;
          border-radius: 12px;
          padding: 20px;
          margin-top: 0;
        }
        .crt__title {
          display: inline-block;
          margin: 0 0 16px;
          padding: 0 0 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0d5c4a;
          border-bottom: 2px solid #0d5c4a;
          line-height: 1.25;
        }
        .crt__table {
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }
        .crt__row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid #d8ede8;
          background: #ffffff;
        }
        .crt__row:last-child {
          border-bottom: none;
        }
        .crt__row--alt {
          background: #e8f5f0;
        }
        .crt__label {
          flex: 0 0 38%;
          max-width: 42%;
          font-size: 13px;
          font-weight: 400;
          color: #6b7280;
          line-height: 1.45;
        }
        .crt__value {
          flex: 1;
          min-width: 0;
          text-align: right;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          line-height: 1.5;
          word-break: break-word;
        }
        .crt__val {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .crt__val--urg {
          font-weight: 700;
          font-size: 15px;
        }
        .crt__val--urg-high {
          color: #dc2626;
        }
        .crt__val--urg-medium {
          color: #d97706;
        }
        .crt__val--urg-low {
          color: #16a34a;
        }
        .crt__val--urg-unk {
          color: #111827;
        }
        .crt-badge {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
        }
        .crt-badge--high {
          background: #fff5f5;
          border-color: #fecaca;
          color: #dc2626;
        }
        .crt-badge--medium {
          background: #fffbeb;
          border-color: #fde68a;
          color: #d97706;
        }
        .crt-badge--low {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #16a34a;
        }
        .crt-badge--unknown {
          background: #f9fafb;
          color: #111827;
        }
        @media (min-width: 768px) {
          .crt__row {
            padding: 16px 20px;
          }
          .crt__label {
            font-size: 14px;
          }
          .crt__value,
          .crt__val,
          .crt__val--urg {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  )
}
