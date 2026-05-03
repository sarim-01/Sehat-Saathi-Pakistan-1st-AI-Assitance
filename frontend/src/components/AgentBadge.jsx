function riskStyle(risk) {
  const r = (risk || "").toString().toUpperCase()
  if (r === "HIGH") return { label: "HIGH", className: "badge badge--high" }
  if (r === "MEDIUM") return { label: "MEDIUM", className: "badge badge--med" }
  if (r === "LOW") return { label: "LOW", className: "badge badge--low" }
  return { label: risk || "—", className: "badge badge--unknown" }
}

const ROUTE_FRIENDLY = {
  NONE: null,
  AGENT_2_MATERNAL: "Maternal care",
  AGENT_3_PEDIATRIC: "Pediatric & newborn",
  AGENT_4_TREATMENT: "Treatment guidance",
  AGENT_5_NUTRITION: "Nutrition",
  AGENT_6_ADULT: "Adult & chronic disease",
}

export default function AgentBadge({ agentUsed, risk }) {
  const rs = riskStyle(risk)
  const lane = agentUsed ? ROUTE_FRIENDLY[agentUsed] || "Specialist support" : null

  return (
    <div className="agent-badges">
      <span className={rs.className} title="Risk level">
        Risk: {rs.label}
      </span>
      {lane && (
        <span className="badge badge--lane" title="Type of guidance">
          {lane}
        </span>
      )}
      <style>{`
        .agent-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .badge {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .badge--lane {
          background: var(--gold-soft);
          color: #7a5a06;
          border: 1px solid rgba(212, 160, 23, 0.35);
          font-weight: 600;
        }
        .badge--high {
          background: var(--risk-high-bg);
          color: var(--risk-high);
        }
        .badge--med {
          background: var(--risk-med-bg);
          color: var(--risk-med);
        }
        .badge--low {
          background: var(--risk-low-bg);
          color: var(--risk-low);
        }
        .badge--unknown {
          background: #eef1f0;
          color: var(--muted);
        }
      `}</style>
    </div>
  )
}
