import { useMemo } from "react"
import {
  mergeClinical,
  formatClinicalValue,
  splitToBullets,
  parseImmediateActionSteps,
  asStringArray,
  splitEmergencyNumbers,
  displayTitleCase,
} from "../utils/clinicalMerge.js"
import { SvgHospitalBuilding, SvgPhone } from "./SvgClinical.jsx"

function Section({ label, delayIndex, accent, children }) {
  return (
    <section className={`cs-sec cs-sec--${accent}`} style={{ animationDelay: `${delayIndex * 80}ms` }}>
      <div className="cs-sec__head">
        <p className="cs-sec__lab">{label}</p>
      </div>
      <div className="cs-sec__bd">{children}</div>
      <style>{`
        .cs-sec {
          background: #ffffff;
          padding: 24px 20px;
          border-bottom: 1px solid #d8ede8;
          opacity: 0;
          animation: cs-fade-up 0.5s ease forwards;
        }
        @keyframes cs-fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .cs-sec:last-child {
          border-bottom: none;
        }
        .cs-sec__head {
          margin-bottom: 12px;
          padding-bottom: 6px;
          padding-left: 11px;
          border-left: 3px solid #0d5c4a;
        }
        .cs-sec__lab {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d5c4a;
        }
        .cs-sec__bd {
          font-size: 15px;
          line-height: 1.65;
          color: #111827;
        }
        .cs-sec--danger .cs-bullet::before {
          color: #dc2626;
          content: "●";
        }
        .cs-sec--referral .cs-bullet::before {
          color: #d97706;
          content: "●";
        }
        .cs-sec--preref .cs-bullet::before {
          color: #d97706;
          content: "●";
        }
        .cs-sec--family .cs-bullet::before {
          color: #0d5c4a;
          content: "●";
        }
        .cs-sec--follow .cs-bullet::before {
          color: #0d5c4a;
          content: "●";
        }
        .cs-sec--follow .cs-bullet--watch::before {
          color: #111827;
          content: "●";
        }
        @media (min-width: 768px) {
          .cs-sec {
            padding: 28px 24px;
          }
          .cs-sec__bd {
            font-size: 16px;
            line-height: 1.7;
          }
        }
      `}</style>
    </section>
  )
}

function Bullets({ lines, mod, watchClass = false }) {
  if (!lines.length) return null
  return (
    <ul className={`cs-ul cs-ul--${mod}`}>
      {lines.map((t, i) => (
        <li key={i} className={`cs-bullet ${watchClass ? "cs-bullet--watch" : ""}`}>
          {t}
        </li>
      ))}
    </ul>
  )
}

export default function ClinicalSections({ result }) {
  const data = useMemo(() => {
    const merged = mergeClinical(result?.triage, result?.specialist)
    const apiRisk = result?.risk ?? merged.risk

    const dangerRaw = [
      merged.danger_signs_present && formatClinicalValue(merged.danger_signs_present),
      merged.danger_signs_to_watch && formatClinicalValue(merged.danger_signs_to_watch),
    ]
      .filter(Boolean)
      .join("\n")
    let ds = splitToBullets(dangerRaw.replace(/^Present:\s*/i, "")).flatMap(splitToBullets)
    ds = [...new Set(ds.map((x) => x.trim()).filter(Boolean))].map((x) => displayTitleCase(x))
    const hasDanger = ds.some((l) => l && !/^no\b/i.test(l))

    const immediateRaw = formatClinicalValue(merged.immediate_action).trim()
    const immediateSteps = parseImmediateActionSteps(immediateRaw).map((st) => ({
      ...st,
      text: st.text ? displayTitleCase(st.text) : st.text,
    }))

    const refFacRaw = formatClinicalValue(merged.referral_facility).trim()
    const refUrgRaw = formatClinicalValue(merged.referral_urgency).trim()
    const referralFacility = refFacRaw && refFacRaw !== "—" ? displayTitleCase(refFacRaw) : ""
    const referralUrgency = refUrgRaw && refUrgRaw !== "—" ? displayTitleCase(refUrgRaw) : ""

    const preRef = asStringArray(merged.pre_referral_actions).map((x) => displayTitleCase(x))
    const lhwKitRaw = formatClinicalValue(merged.lhw_kit_medicines).trim()
    const lhwKit =
      lhwKitRaw && lhwKitRaw !== "—" ? displayTitleCase(lhwKitRaw) : ""
    const emergencyLines = splitEmergencyNumbers(merged.emergency_numbers).map((x) => displayTitleCase(x))

    const familyLines = splitToBullets(
      [merged.family_education, merged.family_counseling].filter(Boolean).map(formatClinicalValue).join("\n")
    ).map((x) => displayTitleCase(x))

    const fu = formatClinicalValue(merged.follow_up).trim()
    const fuLines = fu ? [displayTitleCase(fu)] : []
    const watch = splitToBullets(formatClinicalValue(merged.watch_for || merged.danger_signs_to_watch || "")).map((x) =>
      displayTitleCase(x)
    )

    return {
      merged,
      hasDanger,
      dangerLines: ds,
      immediateSteps,
      referralFacility,
      referralUrgency,
      preRef,
      lhwKit,
      emergencyLines,
      familyLines,
      fuLines,
      watch,
    }
  }, [result])

  const {
    hasDanger,
    dangerLines,
    immediateSteps,
    referralFacility,
    referralUrgency,
    preRef,
    lhwKit,
    emergencyLines,
    familyLines,
    fuLines,
    watch,
  } = data

  let delay = 1

  return (
    <div className="cs-wrap" role="presentation">
      <Section label="DANGER SIGNS" delayIndex={delay++} accent="danger">
        {hasDanger ? (
          <Bullets lines={dangerLines} mod="danger" />
        ) : (
          <p className="cs-ok">No immediate danger signs identified</p>
        )}
      </Section>

      {immediateSteps.length > 0 && (
        <section className="cs-sec cs-sec--steps" style={{ animationDelay: `${delay++ * 80}ms` }}>
          <div className="cs-sec__head">
            <p className="cs-sec__lab">IMMEDIATE ACTION</p>
          </div>
          <div className="cs-sec__bd cs-steps">
            {immediateSteps.map((step, i) => (
              <div key={i} className="cs-step">
                {step.n != null && step.n !== "" ? (
                  <>
                    <div className="cs-step__n">Step {step.n}</div>
                    <div className="cs-step__txt">{step.text || "—"}</div>
                  </>
                ) : (
                  <div className="cs-step__txt cs-step__txt--full">{step.text}</div>
                )}
              </div>
            ))}
          </div>
          <style>{`
            @keyframes cs-fade-up-steps {
              from {
                opacity: 0;
                transform: translateY(14px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .cs-sec--steps {
              background: #ffffff;
              padding: 24px 20px;
              border-bottom: 1px solid #d8ede8;
              opacity: 0;
              animation: cs-fade-up-steps 0.5s ease forwards;
            }
            .cs-steps {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }
            .cs-step {
              display: flex;
              flex-direction: column;
              gap: 4px;
              line-height: 1.65;
            }
            .cs-step__n {
              font-size: 15px;
              font-weight: 700;
              color: #0d5c4a;
            }
            .cs-step__txt {
              font-size: 15px;
              font-weight: 400;
              color: #111827;
            }
            .cs-step__txt--full {
              font-size: 15px;
            }
            @media (min-width: 768px) {
              .cs-sec--steps {
                padding: 28px 24px;
              }
              .cs-step__n,
              .cs-step__txt,
              .cs-step__txt--full {
                font-size: 16px;
              }
            }
          `}</style>
        </section>
      )}

      <Section label="REFERRAL DECISION" delayIndex={delay++} accent="referral">
        <div className="cs-ref">
          {referralFacility || referralUrgency ? (
            <div className="cs-ref__fac-row">
              <span className="cs-ref__ic" aria-hidden>
                <SvgHospitalBuilding size={22} stroke="#d97706" />
              </span>
              <div className="cs-ref__fac-col">
                {referralFacility ? <p className="cs-ref__facility">{referralFacility}</p> : null}
                {referralUrgency ? <p className="cs-ref__urgency">{referralUrgency}</p> : null}
              </div>
            </div>
          ) : (
            <p className="cs-muted">See clinical record for referral details.</p>
          )}
        </div>
      </Section>

      {preRef.length > 0 && (
        <Section label="PRE-REFERRAL ACTIONS" delayIndex={delay++} accent="preref">
          <Bullets lines={preRef} mod="preref" />
        </Section>
      )}

      {lhwKit ? (
        <section className="cs-sec cs-sec--kit" style={{ animationDelay: `${delay++ * 80}ms` }}>
          <div className="cs-sec__head">
            <p className="cs-sec__lab">LHW KIT MEDICINES</p>
          </div>
          <div className="cs-sec__bd">
            <p className="cs-kit">{lhwKit}</p>
          </div>
          <style>{`
            @keyframes cs-fade-up-kit {
              from {
                opacity: 0;
                transform: translateY(14px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .cs-sec--kit {
              background: #ffffff;
              padding: 24px 20px;
              border-bottom: 1px solid #d8ede8;
              opacity: 0;
              animation: cs-fade-up-kit 0.5s ease forwards;
            }
            .cs-kit {
              position: relative;
              margin: 0;
              padding-left: 1.1em;
              font-size: 15px;
              line-height: 1.65;
              color: #111827;
            }
            .cs-kit::before {
              content: "●";
              position: absolute;
              left: 0;
              top: 0.15em;
              font-size: 0.65em;
              color: #0d5c4a;
            }
            @media (min-width: 768px) {
              .cs-sec--kit {
                padding: 28px 24px;
              }
              .cs-kit {
                font-size: 16px;
                line-height: 1.7;
              }
            }
          `}</style>
        </section>
      ) : null}

      {emergencyLines.length > 0 && (
        <section className="cs-sec cs-sec--emergency" style={{ animationDelay: `${delay++ * 80}ms` }}>
          <div className="cs-sec__head">
            <p className="cs-sec__lab">EMERGENCY CONTACTS</p>
          </div>
          <div className="cs-sec__bd">
            <div className="cs-emergency" role="region" aria-label="Emergency numbers">
              {emergencyLines.map((line, i) => (
                <div key={i} className="cs-emergency__row">
                  <span className="cs-emergency__ic" aria-hidden>
                    <SvgPhone size={18} stroke="#dc2626" />
                  </span>
                  <span className="cs-emergency__num">{line}</span>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes cs-fade-up-em {
              from {
                opacity: 0;
                transform: translateY(14px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .cs-sec--emergency {
              background: #ffffff;
              padding: 24px 20px;
              border-bottom: 1px solid #d8ede8;
              opacity: 0;
              animation: cs-fade-up-em 0.5s ease forwards;
            }
            .cs-emergency {
              background: #fff5f5;
              border: 1px solid #dc2626;
              border-radius: 8px;
              padding: 12px;
            }
            .cs-emergency__row {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              margin-bottom: 10px;
            }
            .cs-emergency__row:last-child {
              margin-bottom: 0;
            }
            .cs-emergency__ic {
              flex-shrink: 0;
              margin-top: 1px;
            }
            .cs-emergency__num {
              font-size: 15px;
              font-weight: 700;
              color: #dc2626;
              line-height: 1.45;
              word-break: break-word;
            }
            @media (min-width: 768px) {
              .cs-sec--emergency {
                padding: 28px 24px;
              }
              .cs-emergency__num {
                font-size: 16px;
                line-height: 1.5;
              }
            }
          `}</style>
        </section>
      )}

      <Section label="WHAT TO TELL THE FAMILY" delayIndex={delay++} accent="family">
        {familyLines.length ? (
          <div className="urdu">
            <Bullets lines={familyLines} mod="family" />
          </div>
        ) : (
          <p className="cs-muted">No scripted family wording in this response — use simple, supportive language per training.</p>
        )}
      </Section>

      <Section label="FOLLOW-UP" delayIndex={delay++} accent="follow">
        {fuLines.length > 0 ? <Bullets lines={fuLines} mod="follow" /> : <p className="cs-muted">Routine follow-up per programme.</p>}
        {watch.length > 0 && (
          <>
            <p className="cs-subhead">WATCH FOR</p>
            <Bullets lines={watch} mod="follow" watchClass />
          </>
        )}
      </Section>

      <style>{`
        .cs-wrap {
          background: #ffffff;
          margin: 0;
        }
        .cs-ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cs-ul li {
          position: relative;
          padding-inline-start: 1.1em;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .cs-ul li:last-child {
          margin-bottom: 0;
        }
        .cs-bullet::before {
          position: absolute;
          left: 0;
          top: 0.05em;
          font-size: 0.65em;
          line-height: 1.65;
        }
        .cs-ref {
          margin: 0;
        }
        .cs-ref__fac-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .cs-ref__ic {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .cs-ref__fac-col {
          flex: 1;
          min-width: 0;
        }
        .cs-ref__facility {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 700;
          color: #d97706;
          line-height: 1.5;
        }
        .cs-ref__urgency {
          margin: 0;
          font-size: 15px;
          font-weight: 400;
          color: #111827;
          line-height: 1.65;
        }
        .cs-subhead {
          margin: 20px 0 10px;
          padding-left: 11px;
          border-left: 3px solid #0d5c4a;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d5c4a;
        }
        .cs-muted {
          margin: 0;
          color: #111827;
        }
        .cs-ok {
          margin: 0;
          font-weight: 500;
          color: #16a34a;
        }
        .cs-sec--steps .cs-sec__head,
        .cs-sec--kit .cs-sec__head,
        .cs-sec--emergency .cs-sec__head {
          margin-bottom: 12px;
          padding-bottom: 6px;
          padding-left: 11px;
          border-left: 3px solid #0d5c4a;
        }
        .cs-sec--steps .cs-sec__lab,
        .cs-sec--kit .cs-sec__lab,
        .cs-sec--emergency .cs-sec__lab {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d5c4a;
        }
        @media (min-width: 768px) {
          .cs-ul li {
            font-size: 16px;
            line-height: 1.7;
          }
          .cs-ref__facility,
          .cs-ref__urgency {
            font-size: 16px;
            line-height: 1.7;
          }
        }
      `}</style>
    </div>
  )
}
