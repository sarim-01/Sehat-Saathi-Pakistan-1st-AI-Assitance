function formatValue(v) {
  if (v == null) return "—"
  if (Array.isArray(v)) return v.length ? v.join(" · ") : "—"
  if (typeof v === "object") return JSON.stringify(v, null, 2)
  return String(v)
}

/** Fields safe to show clinicians / LHWs — no routing or agent plumbing. */
const TRIAGE_CLINICAL_ORDER = [
  "risk",
  "patient_type",
  "assessment",
  "reasoning",
  "immediate_action",
  "referral_urgency",
  "family_education",
  "watch_for",
  "home_care",
]

const SPECIALIST_CLINICAL_ORDER = [
  "risk",
  "patient_type",
  "age",
  "gestational_age",
  "primary_concern",
  "assessment",
  "reasoning",
  "immediate_action",
  "referral_urgency",
  "danger_signs_present",
  "danger_signs_to_watch",
  "lhw_can_do",
  "home_care",
  "family_counseling",
  "family_education",
  "nutrition_action",
  "nutrition_screening",
  "immunization_status",
  "birth_preparedness",
  "follow_up",
]

const PRETTY_LABELS = {
  risk: "Risk level",
  patient_type: "Patient type",
  assessment: "Assessment",
  primary_concern: "Main concern",
  reasoning: "Clinical notes",
  immediate_action: "Immediate action",
  referral_urgency: "Referral urgency",
  family_education: "Message for family",
  family_counseling: "Counseling for family",
  watch_for: "Watch for",
  danger_signs_to_watch: "Watch for",
  danger_signs_present: "Danger signs present",
  home_care: "While seeking care / transport",
  lhw_can_do: "What the LHW can do",
  gestational_age: "Pregnancy (weeks / stage)",
  age: "Age",
  immunization_status: "Immunization",
  nutrition_screening: "Nutrition",
  nutrition_action: "Nutrition action",
  birth_preparedness: "Birth / transport plan",
  follow_up: "Follow-up",
}

function labelForKey(key) {
  return PRETTY_LABELS[key] || key.replace(/_/g, " ")
}

function orderedClinicalKeys(data, role) {
  const order = role === "specialist" ? SPECIALIST_CLINICAL_ORDER : TRIAGE_CLINICAL_ORDER
  return order.filter((k) => Object.prototype.hasOwnProperty.call(data, k) && data[k] != null && data[k] !== "")
}

function allKeysOrdered(data, priority) {
  const keys = Object.keys(data)
  return [...priority.filter((k) => keys.includes(k)), ...keys.filter((k) => !priority.includes(k))]
}

/**
 * @param {'triage' | 'specialist'} role
 * @param {'clinical' | 'full'} variant — full shows every JSON key (debug)
 */
export default function ResponseCard({ title, data, urduClass, role = "triage", variant = "clinical" }) {
  if (!data || typeof data !== "object") {
    return (
      <section className="card">
        <h3 className="card__title">{title}</h3>
        <p className="card__empty">No data.</p>
      </section>
    )
  }

  const keys =
    variant === "full"
      ? allKeysOrdered(data, [...TRIAGE_CLINICAL_ORDER, ...SPECIALIST_CLINICAL_ORDER])
      : orderedClinicalKeys(data, role)

  if (variant === "clinical" && keys.length === 0) {
    return (
      <section className="card">
        <h3 className="card__title">{title}</h3>
        <p className="card__empty">No clinical fields in this response.</p>
      </section>
    )
  }

  return (
    <section className={`card card--enter ${urduClass ? "urdu" : ""}`}>
      <h3 className="card__title">{title}</h3>
      <dl className="card__dl">
        {keys.map((key) => (
          <div key={key} className="card__row">
            <dt>{labelForKey(key)}</dt>
            <dd>{formatValue(data[key])}</dd>
          </div>
        ))}
      </dl>
      <style>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.1rem 1.25rem;
          box-shadow: var(--shadow-card);
        }
        .card__title {
          margin: 0 0 0.85rem;
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: -0.02em;
        }
        .card__empty {
          margin: 0;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .card__dl {
          margin: 0;
        }
        .card__row {
          display: grid;
          grid-template-columns: minmax(0, 34%) 1fr;
          gap: 0.35rem 1rem;
          padding: 0.4rem 0;
          border-bottom: 1px solid var(--border);
        }
        .card__row:last-child {
          border-bottom: none;
        }
        .card__row dt {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--muted);
        }
        .card__row dd {
          margin: 0;
          font-size: 0.88rem;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .card--enter {
          opacity: 0;
          animation: card-enter 0.55s ease 0.35s forwards;
        }
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 560px) {
          .card__row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}
