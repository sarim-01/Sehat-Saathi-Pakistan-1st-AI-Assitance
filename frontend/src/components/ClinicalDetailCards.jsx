import { useMemo } from "react"
import {
  mergeClinical,
  formatClinicalValue,
  splitToBullets,
  extractFacilityHint,
  inferReferralUrgencyLevel,
} from "../utils/clinicalMerge.js"
import { SvgCalendarCard, SvgDangerCard, SvgHospitalCard, SvgSpeechCard } from "./SvgClinical.jsx"

function Card({ title, Icon, delayIndex, accent, bulletColor, children }) {
  return (
    <article
      className={`cdc-card cdc-accent--${accent}`}
      style={{
        "--bullet": bulletColor,
        animationDelay: `${delayIndex * 80}ms`,
      }}
    >
      <header className="cdc-card__head">
        <span className="cdc-card__icon" aria-hidden>
          <Icon />
        </span>
        <h3 className="cdc-card__h">{title}</h3>
      </header>
      <div className="cdc-card__body">{children}</div>
      <style>{`
        .cdc-card {
          background: var(--surface);
          border-radius: 14px;
          border: 1px solid var(--border);
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border-left-width: 4px;
          opacity: 0;
          animation: fade-up-card 0.5s ease forwards;
        }
        .cdc-accent--danger {
          border-left-color: #dc2626;
        }
        .cdc-accent--referral {
          border-left-color: #d97706;
        }
        .cdc-accent--family {
          border-left-color: #0d5c4a;
        }
        .cdc-accent--follow {
          border-left-color: #475569;
        }
        .cdc-card__head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .cdc-card__icon {
          flex-shrink: 0;
          display: flex;
        }
        .cdc-card__h {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--primary);
          line-height: 1.2;
        }
        .cdc-card__body {
          font-size: 15px;
          line-height: 1.6;
          color: #374151;
        }
        .cdc-ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cdc-ul li {
          position: relative;
          padding-inline-start: 18px;
          margin-bottom: 10px;
        }
        .cdc-ul li:last-child {
          margin-bottom: 0;
        }
        .cdc-ul li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.55em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--bullet, var(--primary));
        }
      `}</style>
    </article>
  )
}

function Bullets({ items }) {
  return (
    <ul className="cdc-ul">
      {items.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  )
}

export default function ClinicalDetailCards({ result }) {
  const derived = useMemo(() => {
    const merged = mergeClinical(result?.triage, result?.specialist)
    const apiRisk = result?.risk ?? merged.risk

    const dangerRaw = [
      merged.danger_signs_present && formatClinicalValue(merged.danger_signs_present),
      merged.danger_signs_to_watch && formatClinicalValue(merged.danger_signs_to_watch),
    ]
      .filter(Boolean)
      .join("\n")

    let dangerBullets = splitToBullets(dangerRaw.replace(/^Present:\s*/i, ""))
    dangerBullets = dangerBullets.flatMap((b) => splitToBullets(b))
    const dangerDedup = [...new Set(dangerBullets.map((x) => x.trim()).filter(Boolean))]
    const hasDanger = dangerDedup.some((line) => line.length && !/^no\b/i.test(line))

    const referralMain = formatClinicalValue(merged.referral_urgency).trim()
    const facility = extractFacilityHint(merged)
    const level = inferReferralUrgencyLevel(merged, apiRisk)

    const familyBullets = splitToBullets(
      [merged.family_education, merged.family_counseling].filter(Boolean).map(formatClinicalValue).join("\n")
    )

    const followMain = formatClinicalValue(merged.follow_up).trim()
    const watchRaw = formatClinicalValue(merged.watch_for || merged.danger_signs_to_watch || "")
    const watchBullets = watchRaw ? splitToBullets(watchRaw) : []
    const nextBits = []
    if (followMain) nextBits.push(followMain)
    if (!followMain && formatClinicalValue(merged.immediate_action)) {
      nextBits.push(formatClinicalValue(merged.immediate_action))
    }

    return { merged, dangerDedup, hasDanger, referralMain, facility, familyBullets, nextBits, watchBullets, level }
  }, [result])

  const { dangerDedup, hasDanger, referralMain, facility, familyBullets, nextBits, watchBullets, level } = derived

  return (
    <div className="cdc-grid">
      <Card title="Danger signs" Icon={SvgDangerCard} delayIndex={0} accent="danger" bulletColor="#dc2626">
        {hasDanger ? (
          <Bullets items={dangerDedup} />
        ) : (
          <p className="cdc-muted">No immediate danger signs identified from this narrative — still follow programme protocols.</p>
        )}
      </Card>

      <Card title="Referral decision" Icon={SvgHospitalCard} delayIndex={1} accent="referral" bulletColor="#d97706">
        <p className="cdc-level">{level}</p>
        <p className="cdc-ref">{referralMain || "Referral guidance not stated — follow local pathway."}</p>
        <p className="cdc-sub">{facility}</p>
      </Card>

      <Card title="What to tell the family" Icon={SvgSpeechCard} delayIndex={2} accent="family" bulletColor="#0d5c4a">
        {familyBullets.length ? (
          <div className="urdu">
            <Bullets items={familyBullets} />
          </div>
        ) : (
          <p className="cdc-muted">No family wording in this response. Use simple, supportive language per training.</p>
        )}
      </Card>

      <Card title="Follow-up" Icon={SvgCalendarCard} delayIndex={3} accent="follow" bulletColor="#0d5c4a">
        {nextBits.length > 0 && <Bullets items={nextBits} />}
        {watchBullets.length > 0 && (
          <>
            <p className="cdc-subhead">Watch for</p>
            <Bullets items={watchBullets} />
          </>
        )}
        {!nextBits.length && !watchBullets.length && (
          <p className="cdc-muted">Routine follow-up per programme schedule. Re-assess if symptoms worsen.</p>
        )}
      </Card>

      <style>{`
        .cdc-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cdc-level {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 700;
          color: #374151;
        }
        .cdc-ref {
          margin: 0 0 6px;
          font-weight: 600;
          color: #374151;
        }
        .cdc-sub {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .cdc-subhead {
          margin: 14px 0 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--primary);
        }
        .cdc-muted {
          margin: 0;
          font-size: 15px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
